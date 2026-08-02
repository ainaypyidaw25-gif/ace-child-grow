package mm.com.acegroup.acechildgrow;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;

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
        // Reserve the safe drawing area on the native container rather than
        // padding the WebView itself. WebView padding does not move fixed web
        // UI reliably, which can leave the header and bottom navigation under
        // the device's status/navigation bars.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        final View webView = getBridge().getWebView();
        final ViewGroup webViewContainer = (ViewGroup) webView.getParent();
        ViewCompat.setOnApplyWindowInsetsListener(webViewContainer, (view, windowInsets) -> {
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

            // The native container has handled only the safe-drawing edges.
            // Pass the remaining insets (especially IME/keyboard changes) to
            // WebView while zeroing the dimensions already consumed here.
            return new WindowInsetsCompat.Builder(windowInsets)
                .setInsets(
                    WindowInsetsCompat.Type.systemBars()
                        | WindowInsetsCompat.Type.displayCutout(),
                    Insets.NONE
                )
                .build();
        });
        ViewCompat.requestApplyInsets(webViewContainer);
    }
}
