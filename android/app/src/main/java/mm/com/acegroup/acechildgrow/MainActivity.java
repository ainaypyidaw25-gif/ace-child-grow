package mm.com.acegroup.acechildgrow;

import android.os.Bundle;
import android.view.View;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Android 15+ enforces edge-to-edge for apps targeting recent SDKs.
        // Keep the WebView edge-to-edge, then explicitly reserve every safe
        // drawing inset so the app header and fixed bottom navigation never
        // sit underneath status/navigation bars or a display cutout.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        final View webView = getBridge().getWebView();
        ViewCompat.setOnApplyWindowInsetsListener(webView, (view, windowInsets) -> {
            Insets safeDrawing = windowInsets.getInsets(
                WindowInsetsCompat.Type.systemBars()
                    | WindowInsetsCompat.Type.displayCutout()
            );
            view.setPadding(
                safeDrawing.left,
                safeDrawing.top,
                safeDrawing.right,
                safeDrawing.bottom
            );
            return WindowInsetsCompat.CONSUMED;
        });
        ViewCompat.requestApplyInsets(webView);
    }
}
