{
  "targets": [
    {
      "target_name": "native_input",
      "conditions": [
        ["OS=='mac'", {
          "sources": ["src/macos_binding.cc"],
          "include_dirs": [
            "<!@(node -p \"require('node-addon-api').include\")"
          ],
          "libraries": [
            "-framework AppKit",
            "-framework Foundation",
            "-framework Carbon",
            "-framework ApplicationServices",
            "<(module_root_dir)/build-swift/libNativeInputMac.a"
          ],
          "xcode_settings": {
            "CLANG_CXX_LANGUAGE_STANDARD": "c++17",
            "MACOSX_DEPLOYMENT_TARGET": "11.0",
            "OTHER_LDFLAGS": [
              "-L/usr/lib/swift",
              "-L<!(xcrun --sdk macosx --show-sdk-path)/usr/lib/swift"
            ]
          },
          "defines": ["NAPI_DISABLE_CPP_EXCEPTIONS"]
        }],
        ["OS=='win'", {
          "sources": ["src/windows.cpp"],
          "include_dirs": [
            "<!@(node -p \"require('node-addon-api').include\")"
          ],
          "libraries": [
            "-luser32.lib",
            "-lole32.lib",
            "-loleaut32.lib",
            "-luuid.lib"
          ],
          "defines": [
            "NAPI_DISABLE_CPP_EXCEPTIONS",
            "_UNICODE",
            "UNICODE",
            "_WIN32_WINNT=0x0A00"
          ],
          "msvs_settings": {
            "VCCLCompilerTool": {
              "AdditionalOptions": ["/std:c++17", "/EHsc"],
              "ExceptionHandling": 1
            }
          }
        }]
      ]
    }
  ]
}
