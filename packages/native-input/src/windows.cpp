#include <napi.h>
#include <windows.h>
#include <UIAutomation.h>
#include <oleauto.h>
#include <vector>
#include <string>

namespace {

const ULONG_PTR kSelfInjectionMarker = 0x54574853;

std::wstring Utf8ToWide(const std::string& utf8) {
    if (utf8.empty()) return std::wstring();
    int size = MultiByteToWideChar(CP_UTF8, 0, utf8.c_str(), (int)utf8.size(), nullptr, 0);
    std::wstring wide(size, 0);
    MultiByteToWideChar(CP_UTF8, 0, utf8.c_str(), (int)utf8.size(), &wide[0], size);
    return wide;
}

std::string WideToUtf8(const wchar_t* wide, int len) {
    if (!wide || len == 0) return std::string();
    int size = WideCharToMultiByte(CP_UTF8, 0, wide, len, nullptr, 0, nullptr, nullptr);
    std::string out(size, 0);
    WideCharToMultiByte(CP_UTF8, 0, wide, len, &out[0], size, nullptr, nullptr);
    return out;
}

struct ComScope {
    HRESULT hr;
    ComScope() { hr = CoInitializeEx(nullptr, COINIT_MULTITHREADED); }
    ~ComScope() { if (SUCCEEDED(hr)) CoUninitialize(); }
};

void SendUnicodeUnit(WORD unit, bool keyUp) {
    INPUT input = {};
    input.type = INPUT_KEYBOARD;
    input.ki.wVk = 0;
    input.ki.wScan = unit;
    input.ki.dwFlags = KEYEVENTF_UNICODE | (keyUp ? KEYEVENTF_KEYUP : 0);
    // Scan codes with the E0 prefix range need the extendedkey flag to avoid being
    // interpreted as regular keys by some apps.
    if ((unit & 0xFF00) == 0xE000) {
        input.ki.dwFlags |= KEYEVENTF_EXTENDEDKEY;
    }
    SendInput(1, &input, sizeof(INPUT));
}

void SendVirtualKey(WORD vk, DWORD extraFlags, bool keyUp) {
    INPUT input = {};
    input.type = INPUT_KEYBOARD;
    input.ki.wVk = vk;
    input.ki.dwFlags = extraFlags | (keyUp ? KEYEVENTF_KEYUP : 0);
    SendInput(1, &input, sizeof(INPUT));
}

bool WriteClipboardText(const std::wstring& wide) {
    size_t bytes = (wide.size() + 1) * sizeof(wchar_t);
    for (int attempt = 0; attempt < 3; ++attempt) {
        if (!OpenClipboard(nullptr)) {
            if (attempt < 2) { Sleep(50); continue; }
            return false;
        }
        EmptyClipboard();
        HGLOBAL hMem = GlobalAlloc(GMEM_MOVEABLE, bytes);
        if (!hMem) { CloseClipboard(); return false; }
        void* dst = GlobalLock(hMem);
        if (!dst) { GlobalFree(hMem); CloseClipboard(); return false; }
        memcpy(dst, wide.c_str(), bytes);
        GlobalUnlock(hMem);
        SetClipboardData(CF_UNICODETEXT, hMem);
        CloseClipboard();
        return true;
    }
    return false;
}

// Resolve the foreground window's owning process to a base name without ".exe"
// (e.g. "chrome", "msedge", "slack"). This is the Windows analogue of a macOS
// bundle id and is what the server registry matches against.
std::wstring GetProcessNameForWindow(HWND hwnd) {
    DWORD pid = 0;
    GetWindowThreadProcessId(hwnd, &pid);
    if (pid == 0 || pid == GetCurrentProcessId()) return std::wstring();

    HANDLE proc = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, FALSE, pid);
    if (!proc) return std::wstring();

    wchar_t path[MAX_PATH];
    DWORD size = MAX_PATH;
    std::wstring name;
    if (QueryFullProcessImageNameW(proc, 0, path, &size)) {
        std::wstring full(path, size);
        size_t slash = full.find_last_of(L"\\/");
        std::wstring base = (slash == std::wstring::npos) ? full : full.substr(slash + 1);
        size_t dot = base.find_last_of(L'.');
        if (dot != std::wstring::npos && _wcsicmp(base.substr(dot + 1).c_str(), L"exe") == 0) {
            base = base.substr(0, dot);
        }
        name = base;
    }
    CloseHandle(proc);
    return name;
}

}

/**
 * Type text via SendInput with KEYEVENTF_UNICODE.
 * Does not touch the clipboard. Handles UTF-16 surrogate pairs.
 */
Napi::Boolean TypeText(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "String expected").ThrowAsJavaScriptException();
        return Napi::Boolean::New(env, false);
    }

    std::string text = info[0].As<Napi::String>().Utf8Value();
    std::wstring wide = Utf8ToWide(text);

    if (wide.empty()) {
        return Napi::Boolean::New(env, true);
    }

    for (size_t i = 0; i < wide.size(); ++i) {
        WORD unit = (WORD)wide[i];
        SendUnicodeUnit(unit, false);
        SendUnicodeUnit(unit, true);
    }

    return Napi::Boolean::New(env, true);
}

/**
 * Windows does not require a per-app accessibility grant like macOS.
 * Some scenarios (elevated target windows) require the caller to be elevated
 * too, but that is handled at install time, not runtime.
 */
Napi::Boolean CheckAccessibility(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    return Napi::Boolean::New(env, true);
}

/**
 * Detect whether the focused UI element accepts text input using UI Automation.
 * Checks ControlType (Edit/Document) or support for the Text pattern.
 * Falls back to "true" if UIA is unavailable so insertion can still be attempted.
 */
Napi::Boolean HasFocusedTextField(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    ComScope com;

    IUIAutomation* automation = nullptr;
    HRESULT hr = CoCreateInstance(
        __uuidof(CUIAutomation), nullptr, CLSCTX_INPROC_SERVER,
        __uuidof(IUIAutomation), (void**)&automation
    );
    if (FAILED(hr) || !automation) {
        return Napi::Boolean::New(env, true);
    }

    IUIAutomationElement* focused = nullptr;
    hr = automation->GetFocusedElement(&focused);
    if (FAILED(hr) || !focused) {
        automation->Release();
        return Napi::Boolean::New(env, false);
    }

    bool isTextField = false;

    CONTROLTYPEID controlType = 0;
    if (SUCCEEDED(focused->get_CurrentControlType(&controlType))) {
        if (controlType == UIA_EditControlTypeId || controlType == UIA_DocumentControlTypeId) {
            isTextField = true;
        }
    }

    if (!isTextField) {
        IUnknown* textPattern = nullptr;
        if (SUCCEEDED(focused->GetCurrentPattern(UIA_TextPatternId, &textPattern)) && textPattern) {
            isTextField = true;
            textPattern->Release();
        }
    }

    if (!isTextField) {
        IUnknown* valuePattern = nullptr;
        if (SUCCEEDED(focused->GetCurrentPattern(UIA_ValuePatternId, &valuePattern)) && valuePattern) {
            IUIAutomationValuePattern* vp = nullptr;
            if (SUCCEEDED(valuePattern->QueryInterface(__uuidof(IUIAutomationValuePattern), (void**)&vp)) && vp) {
                BOOL readOnly = TRUE;
                if (SUCCEEDED(vp->get_CurrentIsReadOnly(&readOnly)) && !readOnly) {
                    isTextField = true;
                }
                vp->Release();
            }
            valuePattern->Release();
        }
    }

    focused->Release();
    automation->Release();

    return Napi::Boolean::New(env, isTextField);
}

/**
 * Read the current selection from the focused element using UIA TextPattern.
 * Returns empty string if the caret has no selection, null if unreadable.
 */
Napi::Value GetSelectedText(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    ComScope com;

    IUIAutomation* automation = nullptr;
    HRESULT hr = CoCreateInstance(
        __uuidof(CUIAutomation), nullptr, CLSCTX_INPROC_SERVER,
        __uuidof(IUIAutomation), (void**)&automation
    );
    if (FAILED(hr) || !automation) return env.Null();

    IUIAutomationElement* focused = nullptr;
    hr = automation->GetFocusedElement(&focused);
    if (FAILED(hr) || !focused) {
        automation->Release();
        return env.Null();
    }

    IUnknown* raw = nullptr;
    hr = focused->GetCurrentPattern(UIA_TextPatternId, &raw);
    if (FAILED(hr) || !raw) {
        focused->Release();
        automation->Release();
        return env.Null();
    }

    IUIAutomationTextPattern* textPattern = nullptr;
    raw->QueryInterface(__uuidof(IUIAutomationTextPattern), (void**)&textPattern);
    raw->Release();

    Napi::Value result = env.Null();

    if (textPattern) {
        IUIAutomationTextRangeArray* ranges = nullptr;
        if (SUCCEEDED(textPattern->GetSelection(&ranges)) && ranges) {
            int count = 0;
            ranges->get_Length(&count);

            std::wstring combined;
            for (int i = 0; i < count; ++i) {
                IUIAutomationTextRange* range = nullptr;
                if (SUCCEEDED(ranges->GetElement(i, &range)) && range) {
                    BSTR text = nullptr;
                    if (SUCCEEDED(range->GetText(-1, &text)) && text) {
                        combined.append(text, SysStringLen(text));
                        SysFreeString(text);
                    }
                    range->Release();
                }
            }
            ranges->Release();

            std::string utf8 = WideToUtf8(combined.c_str(), (int)combined.size());
            result = Napi::String::New(env, utf8);
        }
        textPattern->Release();
    }

    focused->Release();
    automation->Release();
    return result;
}

/**
 * Fallback: write a unique marker to clipboard, simulate Ctrl+C, poll until
 * clipboard content differs from the marker, then capture the result.
 * Restores the previous clipboard only on success; on failure the marker
 * (or whatever Ctrl+C produced) stays so the user can still paste manually.
 */
Napi::Value GetSelectedTextViaClipboard(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    std::wstring savedText;
    bool hadSaved = false;

    if (OpenClipboard(nullptr)) {
        HANDLE h = GetClipboardData(CF_UNICODETEXT);
        if (h) {
            wchar_t* src = (wchar_t*)GlobalLock(h);
            if (src) {
                savedText.assign(src);
                hadSaved = true;
                GlobalUnlock(h);
            }
        }
        CloseClipboard();
    }

    // Write a unique marker so we can distinguish "Ctrl+C changed the clipboard"
    // from "clipboard already contained the selected text".
    static int markerCounter = 0;
    wchar_t marker[64];
    swprintf(marker, 64, L"__sw-sel-%d-%u__", GetCurrentProcessId(), ++markerCounter);
    std::wstring markerStr(marker);

    if (!WriteClipboardText(markerStr)) {
        return env.Null();
    }

    SendVirtualKey(VK_CONTROL, 0, false);
    SendVirtualKey('C', 0, false);
    SendVirtualKey('C', 0, true);
    SendVirtualKey(VK_CONTROL, 0, true);

    std::wstring captured;
    for (int i = 0; i < 20; ++i) {
        Sleep(5);
        if (OpenClipboard(nullptr)) {
            HANDLE h = GetClipboardData(CF_UNICODETEXT);
            if (h) {
                wchar_t* src = (wchar_t*)GlobalLock(h);
                if (src) {
                    std::wstring current(src);
                    GlobalUnlock(h);
                    if (current != markerStr) {
                        captured = current;
                        CloseClipboard();
                        break;
                    }
                }
            }
            CloseClipboard();
        }
    }

    if (captured.empty()) {
        // Ctrl+C didn't change the clipboard — no selection. Leave clipboard
        // as-is so the user can paste manually if needed.
        return env.Null();
    }

    // Selection captured — restore previous clipboard.
    if (hadSaved) {
        WriteClipboardText(savedText);
    } else if (OpenClipboard(nullptr)) {
        EmptyClipboard();
        CloseClipboard();
    }

    std::string utf8 = WideToUtf8(captured.c_str(), (int)captured.size());
    return Napi::String::New(env, utf8);
}

Napi::Value GetFocusedAppContext(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    HWND hwnd = GetForegroundWindow();
    if (!hwnd) return env.Null();

    std::wstring processName = GetProcessNameForWindow(hwnd);
    if (processName.empty()) return env.Null();

    Napi::Object result = Napi::Object::New(env);
    std::string bundle = WideToUtf8(processName.c_str(), (int)processName.size());
    result.Set("bundleId", Napi::String::New(env, bundle));
    // Windows needs no per-app accessibility grant (see CheckAccessibility).
    result.Set("accessibilityTrusted", Napi::Boolean::New(env, true));
    return result;
}

Napi::Value GetFrontmostPid(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    HWND hwnd = GetForegroundWindow();
    if (!hwnd) return env.Null();
    DWORD pid = 0;
    GetWindowThreadProcessId(hwnd, &pid);
    if (pid == 0) return env.Null();
    return Napi::Number::New(env, (double)pid);
}

Napi::Value GetForegroundWindowHandle(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    HWND hwnd = GetForegroundWindow();
    if (!hwnd) return env.Null();
    return Napi::Number::New(env, (double)(uintptr_t)hwnd);
}

Napi::Boolean ActivateWindow(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsNumber())
        return Napi::Boolean::New(env, false);
    HWND hwnd = (HWND)(uintptr_t)info[0].As<Napi::Number>().Int64Value();
    if (!hwnd) return Napi::Boolean::New(env, false);
    BOOL result = SetForegroundWindow(hwnd);
    return Napi::Boolean::New(env, result != 0);
}

Napi::Boolean IsAnyModifierKeyDown(const Napi::CallbackInfo& info) {
    static const int modifiers[] = {
        VK_SHIFT, VK_LSHIFT, VK_RSHIFT,
        VK_CONTROL, VK_LCONTROL, VK_RCONTROL,
        VK_MENU, VK_LMENU, VK_RMENU,
        VK_LWIN, VK_RWIN
    };
    for (int vk : modifiers) {
        if (GetAsyncKeyState(vk) & 0x8000)
            return Napi::Boolean::New(info.Env(), true);
    }
    return Napi::Boolean::New(info.Env(), false);
}

Napi::Value SnapshotClipboard(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!OpenClipboard(nullptr)) return env.Null();
    HANDLE h = GetClipboardData(CF_UNICODETEXT);
    if (!h) { CloseClipboard(); return env.Null(); }
    wchar_t* src = (wchar_t*)GlobalLock(h);
    if (!src) { CloseClipboard(); return env.Null(); }
    std::wstring text(src);
    GlobalUnlock(h);
    CloseClipboard();
    std::string utf8 = WideToUtf8(text.c_str(), (int)text.size());
    return Napi::String::New(env, utf8);
}

Napi::Boolean WriteClipboard(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsString())
        return Napi::Boolean::New(env, false);
    std::wstring wide = Utf8ToWide(info[0].As<Napi::String>().Utf8Value());
    return Napi::Boolean::New(env, WriteClipboardText(wide));
}

Napi::Boolean RestoreClipboard(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1) return Napi::Boolean::New(env, false);

    if (info[0].IsNull() || info[0].IsUndefined()) {
        if (!OpenClipboard(nullptr)) return Napi::Boolean::New(env, false);
        EmptyClipboard();
        CloseClipboard();
        return Napi::Boolean::New(env, true);
    }

    if (!info[0].IsString()) return Napi::Boolean::New(env, false);
    std::wstring wide = Utf8ToWide(info[0].As<Napi::String>().Utf8Value());
    return Napi::Boolean::New(env, WriteClipboardText(wide));
}

Napi::Number SendPasteInput(const Napi::CallbackInfo& info) {
    INPUT inputs[4] = {};
    for (auto& inp : inputs) {
        inp.type = INPUT_KEYBOARD;
        inp.ki.dwExtraInfo = kSelfInjectionMarker;
    }
    inputs[0].ki.wVk = VK_CONTROL;
    inputs[1].ki.wVk = 'V';
    inputs[2].ki.wVk = 'V';        inputs[2].ki.dwFlags = KEYEVENTF_KEYUP;
    inputs[3].ki.wVk = VK_CONTROL;  inputs[3].ki.dwFlags = KEYEVENTF_KEYUP;

    UINT sent = SendInput(4, inputs, sizeof(INPUT));
    return Napi::Number::New(info.Env(), (double)sent);
}

// Terminal-safe paste: Ctrl+V is not a paste shortcut in classic consoles,
// PuTTY, or mintty, but Shift+Insert pastes in every Windows terminal
// (conhost, Windows Terminal, PuTTY, mintty, alacritty, wezterm).
Napi::Number SendShiftInsertInput(const Napi::CallbackInfo& info) {
    INPUT inputs[4] = {};
    for (auto& inp : inputs) {
        inp.type = INPUT_KEYBOARD;
        inp.ki.dwExtraInfo = kSelfInjectionMarker;
    }
    inputs[0].ki.wVk = VK_SHIFT;
    inputs[1].ki.wVk = VK_INSERT;  inputs[1].ki.dwFlags = KEYEVENTF_EXTENDEDKEY;
    inputs[2].ki.wVk = VK_INSERT;  inputs[2].ki.dwFlags = KEYEVENTF_EXTENDEDKEY | KEYEVENTF_KEYUP;
    inputs[3].ki.wVk = VK_SHIFT;   inputs[3].ki.dwFlags = KEYEVENTF_KEYUP;

    UINT sent = SendInput(4, inputs, sizeof(INPUT));
    return Napi::Number::New(info.Env(), (double)sent);
}

Napi::Value GetWindowProcessName(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsNumber()) return env.Null();
    HWND hwnd = (HWND)(uintptr_t)info[0].As<Napi::Number>().Int64Value();
    if (!hwnd) return env.Null();
    std::wstring processName = GetProcessNameForWindow(hwnd);
    if (processName.empty()) return env.Null();
    std::string utf8 = WideToUtf8(processName.c_str(), (int)processName.size());
    return Napi::String::New(env, utf8);
}

Napi::Number SendCopyInput(const Napi::CallbackInfo& info) {
    INPUT inputs[4] = {};
    for (auto& inp : inputs) {
        inp.type = INPUT_KEYBOARD;
        inp.ki.dwExtraInfo = kSelfInjectionMarker;
    }
    inputs[0].ki.wVk = VK_CONTROL;
    inputs[1].ki.wVk = 'C';
    inputs[2].ki.wVk = 'C';        inputs[2].ki.dwFlags = KEYEVENTF_KEYUP;
    inputs[3].ki.wVk = VK_CONTROL;  inputs[3].ki.dwFlags = KEYEVENTF_KEYUP;

    UINT sent = SendInput(4, inputs, sizeof(INPUT));
    return Napi::Number::New(info.Env(), (double)sent);
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set("typeText", Napi::Function::New(env, TypeText));
    exports.Set("checkAccessibility", Napi::Function::New(env, CheckAccessibility));
    exports.Set("hasFocusedTextField", Napi::Function::New(env, HasFocusedTextField));
    exports.Set("getSelectedText", Napi::Function::New(env, GetSelectedText));
    exports.Set("getSelectedTextViaClipboard", Napi::Function::New(env, GetSelectedTextViaClipboard));
    exports.Set("getFocusedAppContext", Napi::Function::New(env, GetFocusedAppContext));
    exports.Set("getFrontmostPid", Napi::Function::New(env, GetFrontmostPid));
    exports.Set("getForegroundWindowHandle", Napi::Function::New(env, GetForegroundWindowHandle));
    exports.Set("activateWindow", Napi::Function::New(env, ActivateWindow));
    exports.Set("isAnyModifierKeyDown", Napi::Function::New(env, IsAnyModifierKeyDown));
    exports.Set("snapshotClipboard", Napi::Function::New(env, SnapshotClipboard));
    exports.Set("writeClipboard", Napi::Function::New(env, WriteClipboard));
    exports.Set("restoreClipboard", Napi::Function::New(env, RestoreClipboard));
    exports.Set("sendPasteInput", Napi::Function::New(env, SendPasteInput));
    exports.Set("sendShiftInsertInput", Napi::Function::New(env, SendShiftInsertInput));
    exports.Set("getWindowProcessName", Napi::Function::New(env, GetWindowProcessName));
    exports.Set("sendCopyInput", Napi::Function::New(env, SendCopyInput));
    return exports;
}

NODE_API_MODULE(native_input, Init)
