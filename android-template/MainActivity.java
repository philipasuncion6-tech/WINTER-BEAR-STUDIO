package com.asuncion.winterbearstudio;

import android.content.ContentValues;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.JavascriptInterface;

import com.getcapacitor.BridgeActivity;

import java.io.OutputStream;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getBridge().getWebView().addJavascriptInterface(
            new AndroidDownloader(), "AndroidDownloader"
        );
    }

    public class AndroidDownloader {
        @JavascriptInterface
        public String saveBase64(String fileName, String base64Data) {
            try {
                String safeName = fileName == null ? "winter-bear-memory.mp4"
                    : fileName.replaceAll("[^A-Za-z0-9._-]", "_");
                if (!safeName.toLowerCase().endsWith(".mp4")) safeName += ".mp4";
                byte[] bytes = Base64.decode(base64Data, Base64.DEFAULT);

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    ContentValues values = new ContentValues();
                    values.put(MediaStore.Downloads.DISPLAY_NAME, safeName);
                    values.put(MediaStore.Downloads.MIME_TYPE, "video/mp4");
                    values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
                    values.put(MediaStore.Downloads.IS_PENDING, 1);

                    Uri uri = getContentResolver().insert(
                        MediaStore.Downloads.EXTERNAL_CONTENT_URI, values
                    );
                    if (uri == null) return "ERROR: Could not create Downloads file.";

                    try (OutputStream output = getContentResolver().openOutputStream(uri)) {
                        if (output == null) return "ERROR: Could not open Downloads file.";
                        output.write(bytes);
                        output.flush();
                    }

                    values.clear();
                    values.put(MediaStore.Downloads.IS_PENDING, 0);
                    getContentResolver().update(uri, values, null, null);
                    return "OK";
                }
                return "ERROR: Android 10 or newer is required for direct Downloads saving.";
            } catch (Exception error) {
                return "ERROR: " + error.getMessage();
            }
        }
    }
}