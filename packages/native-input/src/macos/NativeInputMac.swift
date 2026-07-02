import AppKit
import ApplicationServices
import Carbon.HIToolbox
import Foundation

// C ABI surface consumed by src/macos_binding.cc. Strings returned as strdup'd
// UTF-8 buffers; the binding copies them into JS strings and calls ni_string_free.

private func copiedCString(_ value: String?) -> UnsafeMutablePointer<CChar>? {
  guard let value else { return nil }
  return strdup(value)
}

@_cdecl("ni_string_free")
public func ni_string_free(_ pointer: UnsafeMutablePointer<CChar>?) {
  free(pointer)
}

// MARK: - Pasteboard snapshot / restore

private typealias PasteboardSnapshot = [[NSPasteboard.PasteboardType: Data]]

// Captures every type for every item — text, RTF, image, file URLs, custom UTIs —
// preserving exact bytes so apps that rely on specific representations keep working.
private func snapshotPasteboard(_ pb: NSPasteboard) -> PasteboardSnapshot {
  var saved: PasteboardSnapshot = []
  for item in pb.pasteboardItems ?? [] {
    var itemData: [NSPasteboard.PasteboardType: Data] = [:]
    for type in item.types {
      if let data = item.data(forType: type) {
        itemData[type] = data
      }
    }
    if !itemData.isEmpty {
      saved.append(itemData)
    }
  }
  return saved
}

private func restorePasteboard(_ pb: NSPasteboard, _ snapshot: PasteboardSnapshot) {
  pb.clearContents()
  guard !snapshot.isEmpty else { return }
  var restored: [NSPasteboardItem] = []
  for itemData in snapshot {
    let item = NSPasteboardItem()
    for (type, data) in itemData {
      item.setData(data, forType: type)
    }
    restored.append(item)
  }
  pb.writeObjects(restored)
}

// MARK: - Text insertion

// Clipboard managers that respect the nspasteboard.org convention (Raycast,
// Maccy, Paste, Alfred, …) ignore items carrying this marker, so the user's
// clipboard history is not polluted by the transient paste.
private let transientType = NSPasteboard.PasteboardType("org.nspasteboard.TransientType")

// Electron renderers under load can take >100ms to drain the input queue after
// Cmd+V lands, so the original pasteboard is restored on a delay. The restore is
// scheduled on the main queue instead of blocking in usleep — the Electron main
// thread keeps pumping UI and IPC while the target app consumes the paste.
private let pasteConsumeDelaySeconds: TimeInterval = 0.18

private func postCmdKeystroke(_ keyCode: CGKeyCode) -> Bool {
  let source = CGEventSource(stateID: .combinedSessionState)
  guard let down = CGEvent(keyboardEventSource: source, virtualKey: keyCode, keyDown: true) else {
    return false
  }
  down.flags = .maskCommand
  down.post(tap: .cghidEventTap)
  if let up = CGEvent(keyboardEventSource: source, virtualKey: keyCode, keyDown: false) {
    up.flags = .maskCommand
    up.post(tap: .cghidEventTap)
  }
  return true
}

// Atomic paste via the general pasteboard with the transient marker.
// Flow: snapshot pasteboard → write text + marker → verify it landed → post
// Cmd+V → schedule restore after the target app consumes the paste.
// Returns false only on hard failures (write rejected, event creation failed),
// so the caller can fall back to chunked keyboard simulation.
private func tryInsertViaPasteboard(_ text: String) -> Bool {
  if text.isEmpty { return true }

  let pb = NSPasteboard.general
  let snapshot = snapshotPasteboard(pb)

  pb.clearContents()
  let item = NSPasteboardItem()
  guard item.setString(text, forType: .string) else {
    restorePasteboard(pb, snapshot)
    return false
  }
  item.setString("", forType: transientType)

  guard pb.writeObjects([item]) else {
    restorePasteboard(pb, snapshot)
    return false
  }

  guard pb.string(forType: .string) == text else {
    restorePasteboard(pb, snapshot)
    return false
  }

  guard postCmdKeystroke(CGKeyCode(kVK_ANSI_V)) else {
    restorePasteboard(pb, snapshot)
    return false
  }

  DispatchQueue.main.asyncAfter(deadline: .now() + pasteConsumeDelaySeconds) {
    restorePasteboard(pb, snapshot)
  }
  return true
}

// Fallback: chunked CGEvent typing. CGEventKeyboardSetUnicodeString caps at 20
// UTF-16 units per event, and Electron-based apps need ≥3ms between events to
// avoid reordering. Rare path — only when the pasteboard write itself fails.
private func typeTextChunked(_ text: String) -> Bool {
  let utf16Units = Array(text.utf16)
  let chunkSize = 20
  var index = 0
  while index < utf16Units.count {
    let count = min(chunkSize, utf16Units.count - index)
    var chunk = Array(utf16Units[index ..< index + count])

    guard let down = CGEvent(keyboardEventSource: nil, virtualKey: 0, keyDown: true) else {
      return false
    }
    down.keyboardSetUnicodeString(stringLength: count, unicodeString: &chunk)
    down.flags = []
    down.post(tap: .cghidEventTap)

    if let up = CGEvent(keyboardEventSource: nil, virtualKey: 0, keyDown: false) {
      up.flags = []
      up.post(tap: .cghidEventTap)
    }

    usleep(3000)
    index += count
  }
  return true
}

@_cdecl("ni_type_text")
public func ni_type_text(_ utf8: UnsafePointer<CChar>?) -> Bool {
  guard let utf8 else { return false }
  let text = String(cString: utf8)
  if text.isEmpty { return true }
  if tryInsertViaPasteboard(text) { return true }
  return typeTextChunked(text)
}

// MARK: - Accessibility

@_cdecl("ni_check_accessibility")
public func ni_check_accessibility(_ promptIfNeeded: Bool) -> Bool {
  let key = kAXTrustedCheckOptionPrompt.takeUnretainedValue() as String
  return AXIsProcessTrustedWithOptions([key: promptIfNeeded] as CFDictionary)
}

private func copyFocusedElement() -> AXUIElement? {
  let systemWide = AXUIElementCreateSystemWide()
  var focused: CFTypeRef?
  let error = AXUIElementCopyAttributeValue(
    systemWide, kAXFocusedUIElementAttribute as CFString, &focused
  )
  guard error == .success, let focused, CFGetTypeID(focused) == AXUIElementGetTypeID() else {
    return nil
  }
  return (focused as! AXUIElement)
}

@_cdecl("ni_has_focused_text_field")
public func ni_has_focused_text_field() -> Bool {
  guard let focused = copyFocusedElement() else { return false }

  var role: CFTypeRef?
  if AXUIElementCopyAttributeValue(focused, kAXRoleAttribute as CFString, &role) == .success,
    let role, CFGetTypeID(role) == CFStringGetTypeID() {
    let roleString = role as! CFString as String
    let editableRoles: Set<String> = [
      kAXTextFieldRole as String,
      kAXTextAreaRole as String,
      kAXComboBoxRole as String,
      "AXWebArea",
      kAXGroupRole as String,
    ]
    if editableRoles.contains(roleString) { return true }
  }

  var isSettable = DarwinBoolean(false)
  AXUIElementIsAttributeSettable(focused, kAXValueAttribute as CFString, &isSettable)
  return isSettable.boolValue
}

private func readStringAttribute(_ element: AXUIElement, _ attribute: CFString) -> String? {
  var value: CFTypeRef?
  guard AXUIElementCopyAttributeValue(element, attribute, &value) == .success, let value else {
    return nil
  }
  guard CFGetTypeID(value) == CFStringGetTypeID() else { return nil }
  return (value as! CFString) as String
}

@_cdecl("ni_get_selected_text")
public func ni_get_selected_text() -> UnsafeMutablePointer<CChar>? {
  guard let focused = copyFocusedElement() else { return nil }
  var value: CFTypeRef?
  let error = AXUIElementCopyAttributeValue(
    focused, kAXSelectedTextAttribute as CFString, &value
  )
  guard error == .success, let value, CFGetTypeID(value) == CFStringGetTypeID() else {
    return nil
  }
  return copiedCString((value as! CFString) as String)
}

@_cdecl("ni_get_selected_text_via_clipboard")
public func ni_get_selected_text_via_clipboard() -> UnsafeMutablePointer<CChar>? {
  let pb = NSPasteboard.general
  let originalChangeCount = pb.changeCount
  let snapshot = snapshotPasteboard(pb)

  guard postCmdKeystroke(CGKeyCode(kVK_ANSI_C)) else { return nil }

  // Poll for clipboard update (5ms intervals, 100ms max)
  var clipboardChanged = false
  for _ in 0 ..< 20 {
    usleep(5000)
    if pb.changeCount != originalChangeCount {
      clipboardChanged = true
      break
    }
  }

  let capturedText = clipboardChanged ? pb.string(forType: .string) : nil
  restorePasteboard(pb, snapshot)

  guard let capturedText, !capturedText.isEmpty else { return nil }
  return copiedCString(capturedText)
}

// MARK: - Focused app context

private func readRangeAttribute(_ element: AXUIElement, _ attribute: CFString) -> CFRange? {
  var value: CFTypeRef?
  guard AXUIElementCopyAttributeValue(element, attribute, &value) == .success, let value else {
    return nil
  }
  guard CFGetTypeID(value) == AXValueGetTypeID() else { return nil }
  let axValue = value as! AXValue
  guard AXValueGetType(axValue) == .cfRange else { return nil }
  var range = CFRange()
  guard AXValueGetValue(axValue, .cfRange, &range) else { return nil }
  return range
}

private func readNumberAttribute(_ element: AXUIElement, _ attribute: CFString) -> CFIndex? {
  var value: CFTypeRef?
  guard AXUIElementCopyAttributeValue(element, attribute, &value) == .success, let value else {
    return nil
  }
  guard CFGetTypeID(value) == CFNumberGetTypeID() else { return nil }
  var number: CFIndex = 0
  guard CFNumberGetValue((value as! CFNumber), .cfIndexType, &number) else { return nil }
  return number
}

private func readStringForRange(_ element: AXUIElement, _ range: CFRange) -> String? {
  guard range.location >= 0, range.length >= 0 else { return nil }
  var mutableRange = range
  guard let rangeValue = AXValueCreate(.cfRange, &mutableRange) else { return nil }

  var value: CFTypeRef?
  let error = AXUIElementCopyParameterizedAttributeValue(
    element, kAXStringForRangeParameterizedAttribute as CFString, rangeValue, &value
  )
  guard error == .success, let value, CFGetTypeID(value) == CFStringGetTypeID() else {
    return nil
  }
  return (value as! CFString) as String
}

private func readContextText(_ element: AXUIElement) -> String? {
  if let selected = readStringAttribute(element, kAXSelectedTextAttribute as CFString),
    !selected.isEmpty {
    return selected
  }

  if let value = readStringAttribute(element, kAXValueAttribute as CFString), !value.isEmpty {
    return value
  }

  if let visibleRange = readRangeAttribute(element, kAXVisibleCharacterRangeAttribute as CFString),
    visibleRange.location >= 0, visibleRange.length > 0,
    let visibleText = readStringForRange(element, visibleRange), !visibleText.isEmpty {
    return visibleText
  }

  let selectedRange = readRangeAttribute(element, kAXSelectedTextRangeAttribute as CFString)
  let characterCount = readNumberAttribute(element, kAXNumberOfCharactersAttribute as CFString)

  if let selectedRange, let characterCount, characterCount > 0 {
    let anchor = max(selectedRange.location, 0)
    let start = anchor > 1000 ? anchor - 1000 : 0
    let end = min(anchor + selectedRange.length + 1000, characterCount)
    if end > start,
      let nearby = readStringForRange(element, CFRange(location: start, length: end - start)),
      !nearby.isEmpty {
      return nearby
    }
  }

  if let characterCount, characterCount > 0 {
    let sampleLength = min(characterCount, 2000)
    if let prefix = readStringForRange(element, CFRange(location: 0, length: sampleLength)),
      !prefix.isEmpty {
      return prefix
    }
  }

  return nil
}

private func readFocusedElementContext(_ element: AXUIElement) -> String? {
  var current: AXUIElement? = element
  for _ in 0 ..< 4 {
    guard let element = current else { return nil }
    if let contextText = readContextText(element), !contextText.isEmpty {
      return contextText
    }

    var parent: CFTypeRef?
    let parentError = AXUIElementCopyAttributeValue(
      element, kAXParentAttribute as CFString, &parent
    )
    if parentError == .success, let parent, CFGetTypeID(parent) == AXUIElementGetTypeID() {
      current = (parent as! AXUIElement)
    } else {
      current = nil
    }
  }
  return nil
}

// Returns a JSON object {bundleId, accessibilityTrusted, title?, accessibilityText?}
// or null when there is no frontmost app. JSON keeps the C ABI to a single string.
@_cdecl("ni_get_focused_app_context_json")
public func ni_get_focused_app_context_json() -> UnsafeMutablePointer<CChar>? {
  guard let frontmost = NSWorkspace.shared.frontmostApplication,
    let bundleId = frontmost.bundleIdentifier, !bundleId.isEmpty else {
    return nil
  }

  var title: String?
  var accessibilityText: String?
  let accessibilityTrusted = AXIsProcessTrusted()

  let appElement = AXUIElementCreateApplication(frontmost.processIdentifier)
  if accessibilityTrusted {
    // Chromium/Electron apps lazy-init their AX tree. Setting AXManualAccessibility
    // forces them to expose it. No-op on apps that already expose AX.
    AXUIElementSetAttributeValue(appElement, "AXManualAccessibility" as CFString, kCFBooleanTrue)
  }

  var focusedWindow: CFTypeRef?
  if AXUIElementCopyAttributeValue(
    appElement, kAXFocusedWindowAttribute as CFString, &focusedWindow
  ) == .success, let focusedWindow, CFGetTypeID(focusedWindow) == AXUIElementGetTypeID() {
    title = readStringAttribute((focusedWindow as! AXUIElement), kAXTitleAttribute as CFString)
  }

  if title == nil || title?.isEmpty == true {
    title = frontmost.localizedName
  }

  if accessibilityTrusted {
    if let focusedElement = copyFocusedElement() {
      accessibilityText = readFocusedElementContext(focusedElement)
      if accessibilityText == nil || accessibilityText?.isEmpty == true {
        NSLog("[ax] focused element returned no text bundle=%@ (likely custom-rendered app)", bundleId)
      }
    } else {
      NSLog("[ax] focused element lookup failed bundle=%@", bundleId)
    }
  } else {
    NSLog("[ax] accessibility permission not granted, skipping text read bundle=%@", bundleId)
  }

  var payload: [String: Any] = [
    "bundleId": bundleId,
    "accessibilityTrusted": accessibilityTrusted,
  ]
  if let title, !title.isEmpty { payload["title"] = title }
  if let accessibilityText, !accessibilityText.isEmpty {
    payload["accessibilityText"] = accessibilityText
  }

  guard let data = try? JSONSerialization.data(withJSONObject: payload),
    let json = String(data: data, encoding: .utf8) else {
    return nil
  }
  return copiedCString(json)
}

// MARK: - Process helpers

@_cdecl("ni_get_frontmost_pid")
public func ni_get_frontmost_pid() -> Int32 {
  guard let app = NSWorkspace.shared.frontmostApplication else { return -1 }
  return app.processIdentifier
}

@_cdecl("ni_get_frontmost_bundle_id")
public func ni_get_frontmost_bundle_id() -> UnsafeMutablePointer<CChar>? {
  guard let app = NSWorkspace.shared.frontmostApplication,
    let bundleId = app.bundleIdentifier, !bundleId.isEmpty else {
    return nil
  }
  return copiedCString(bundleId)
}

@_cdecl("ni_get_bundle_id_for_pid")
public func ni_get_bundle_id_for_pid(_ pid: Int32) -> UnsafeMutablePointer<CChar>? {
  guard let app = NSRunningApplication(processIdentifier: pid),
    let bundleId = app.bundleIdentifier, !bundleId.isEmpty else {
    return nil
  }
  return copiedCString(bundleId)
}

@_cdecl("ni_activate_application_by_pid")
public func ni_activate_application_by_pid(_ pid: Int32) -> Bool {
  guard pid > 0, let app = NSRunningApplication(processIdentifier: pid) else { return false }
  return app.activate(options: [.activateIgnoringOtherApps])
}

@_cdecl("ni_enable_accessibility_for_pid")
public func ni_enable_accessibility_for_pid(
  _ pid: Int32, _ modeUtf8: UnsafePointer<CChar>?
) -> Bool {
  guard let modeUtf8 else { return false }
  let mode = String(cString: modeUtf8)

  let attribute: CFString
  switch mode {
  case "manual": attribute = "AXManualAccessibility" as CFString
  case "enhanced": attribute = "AXEnhancedUserInterface" as CFString
  default: return false
  }

  let appElement = AXUIElementCreateApplication(pid)
  return AXUIElementSetAttributeValue(appElement, attribute, kCFBooleanTrue) == .success
}

@_cdecl("ni_get_focused_field_value_for_pid")
public func ni_get_focused_field_value_for_pid(_ pid: Int32) -> UnsafeMutablePointer<CChar>? {
  let appElement = AXUIElementCreateApplication(pid)

  var focused: CFTypeRef?
  let focusError = AXUIElementCopyAttributeValue(
    appElement, kAXFocusedUIElementAttribute as CFString, &focused
  )
  guard focusError == .success, let focused, CFGetTypeID(focused) == AXUIElementGetTypeID() else {
    return nil
  }

  var value: CFTypeRef?
  let valueError = AXUIElementCopyAttributeValue(
    (focused as! AXUIElement), kAXValueAttribute as CFString, &value
  )
  guard valueError == .success, let value, CFGetTypeID(value) == CFStringGetTypeID() else {
    return nil
  }
  return copiedCString((value as! CFString) as String)
}
