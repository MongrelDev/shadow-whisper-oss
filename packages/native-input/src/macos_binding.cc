#include <napi.h>

#include <cstdint>

// C ABI implemented in Swift (src/macos/NativeInputMac.swift), linked in as a
// static library. Strings are strdup'd by Swift; FreedString releases them.
extern "C" {
bool ni_type_text(const char* utf8);
bool ni_check_accessibility(bool prompt_if_needed);
bool ni_has_focused_text_field(void);
char* ni_get_selected_text(void);
char* ni_get_selected_text_via_clipboard(void);
char* ni_get_focused_app_context_json(void);
int32_t ni_get_frontmost_pid(void);
char* ni_get_frontmost_bundle_id(void);
char* ni_get_bundle_id_for_pid(int32_t pid);
bool ni_activate_application_by_pid(int32_t pid);
bool ni_enable_accessibility_for_pid(int32_t pid, const char* mode);
char* ni_get_focused_field_value_for_pid(int32_t pid);
void ni_string_free(char* pointer);
}

namespace {

Napi::Value FreedString(Napi::Env env, char* value) {
  if (!value) return env.Null();
  Napi::Value result = Napi::String::New(env, value);
  ni_string_free(value);
  return result;
}

Napi::Boolean TypeText(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (info.Length() < 1 || !info[0].IsString()) {
    Napi::TypeError::New(env, "String expected").ThrowAsJavaScriptException();
    return Napi::Boolean::New(env, false);
  }
  std::string text = info[0].As<Napi::String>().Utf8Value();
  return Napi::Boolean::New(env, ni_type_text(text.c_str()));
}

Napi::Boolean CheckAccessibility(const Napi::CallbackInfo& info) {
  bool promptIfNeeded = true;
  if (info.Length() >= 1 && info[0].IsBoolean()) {
    promptIfNeeded = info[0].As<Napi::Boolean>().Value();
  }
  return Napi::Boolean::New(info.Env(), ni_check_accessibility(promptIfNeeded));
}

Napi::Boolean HasFocusedTextField(const Napi::CallbackInfo& info) {
  return Napi::Boolean::New(info.Env(), ni_has_focused_text_field());
}

Napi::Value GetSelectedText(const Napi::CallbackInfo& info) {
  return FreedString(info.Env(), ni_get_selected_text());
}

Napi::Value GetSelectedTextViaClipboard(const Napi::CallbackInfo& info) {
  return FreedString(info.Env(), ni_get_selected_text_via_clipboard());
}

Napi::Value GetFocusedAppContext(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  char* json = ni_get_focused_app_context_json();
  if (!json) return env.Null();

  Napi::String jsonString = Napi::String::New(env, json);
  ni_string_free(json);

  Napi::Object jsonObject = env.Global().Get("JSON").As<Napi::Object>();
  Napi::Function parse = jsonObject.Get("parse").As<Napi::Function>();
  Napi::Value parsed = parse.Call(jsonObject, {jsonString});
  if (env.IsExceptionPending()) {
    env.GetAndClearPendingException();
    return env.Null();
  }
  return parsed;
}

Napi::Value GetFrontmostPid(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  int32_t pid = ni_get_frontmost_pid();
  if (pid <= 0) return env.Null();
  return Napi::Number::New(env, static_cast<double>(pid));
}

Napi::Value GetFrontmostBundleId(const Napi::CallbackInfo& info) {
  return FreedString(info.Env(), ni_get_frontmost_bundle_id());
}

int32_t PidArgument(const Napi::CallbackInfo& info) {
  if (info.Length() < 1 || !info[0].IsNumber()) return -1;
  return info[0].As<Napi::Number>().Int32Value();
}

Napi::Value GetBundleIdForPid(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  int32_t pid = PidArgument(info);
  if (pid <= 0) return env.Null();
  return FreedString(env, ni_get_bundle_id_for_pid(pid));
}

Napi::Boolean ActivateApplicationByPid(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  int32_t pid = PidArgument(info);
  if (pid <= 0) return Napi::Boolean::New(env, false);
  return Napi::Boolean::New(env, ni_activate_application_by_pid(pid));
}

Napi::Boolean EnableAccessibilityForPid(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (info.Length() < 2 || !info[0].IsNumber() || !info[1].IsString()) {
    return Napi::Boolean::New(env, false);
  }
  int32_t pid = info[0].As<Napi::Number>().Int32Value();
  std::string mode = info[1].As<Napi::String>().Utf8Value();
  return Napi::Boolean::New(env, ni_enable_accessibility_for_pid(pid, mode.c_str()));
}

Napi::Value GetFocusedFieldValueForPid(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  int32_t pid = PidArgument(info);
  if (pid <= 0) return env.Null();
  return FreedString(env, ni_get_focused_field_value_for_pid(pid));
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set("typeText", Napi::Function::New(env, TypeText));
  exports.Set("checkAccessibility", Napi::Function::New(env, CheckAccessibility));
  exports.Set("hasFocusedTextField", Napi::Function::New(env, HasFocusedTextField));
  exports.Set("getSelectedText", Napi::Function::New(env, GetSelectedText));
  exports.Set("getSelectedTextViaClipboard", Napi::Function::New(env, GetSelectedTextViaClipboard));
  exports.Set("getFocusedAppContext", Napi::Function::New(env, GetFocusedAppContext));
  exports.Set("getFrontmostPid", Napi::Function::New(env, GetFrontmostPid));
  exports.Set("getFrontmostBundleId", Napi::Function::New(env, GetFrontmostBundleId));
  exports.Set("getBundleIdForPid", Napi::Function::New(env, GetBundleIdForPid));
  exports.Set("activateApplicationByPid", Napi::Function::New(env, ActivateApplicationByPid));
  exports.Set("enableAccessibilityForPid", Napi::Function::New(env, EnableAccessibilityForPid));
  exports.Set("getFocusedFieldValueForPid", Napi::Function::New(env, GetFocusedFieldValueForPid));
  return exports;
}

}  // namespace

NODE_API_MODULE(native_input, Init)
