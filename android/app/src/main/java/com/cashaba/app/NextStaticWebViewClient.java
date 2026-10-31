package com.cashaba.app;

import android.net.Uri;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeWebViewClient;
import java.io.IOException;
import java.io.InputStream;
import java.util.Map;

/** Resolve full-page Next navigations to the corresponding bundled HTML.
 * Capacitor normally serves the root index for every extensionless URL, which
 * would hydrate the landing page when reloading login or an OAuth callback.
 */
public class NextStaticWebViewClient extends BridgeWebViewClient {
    private final Bridge appBridge;

    public NextStaticWebViewClient(Bridge bridge) {
        super(bridge);
        appBridge = bridge;
    }

    @Override
    public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
        Uri url = request.getUrl();
        String path = url.getPath();
        if (request.isForMainFrame() && "GET".equals(request.getMethod())
            && "https".equals(url.getScheme()) && "localhost".equals(url.getAuthority())
            && path != null && path.matches("/[A-Za-z0-9_/-]*")) {
            String htmlPath = path.replaceAll("/+$", "") + "/index.html";
            try (InputStream ignored = appBridge.getContext().getAssets().open("public" + htmlPath)) {
                // The bridge still injects its native runtime and handles MIME
                // types; only the asset path is changed, not the visible URL.
            } catch (IOException missingPage) {
                htmlPath = "/404.html";
            }
            Uri resolved = url.buildUpon().path(htmlPath).build();
            return super.shouldInterceptRequest(view, new WebResourceRequest() {
                @Override public Uri getUrl() { return resolved; }
                @Override public boolean isForMainFrame() { return request.isForMainFrame(); }
                @Override public boolean isRedirect() { return request.isRedirect(); }
                @Override public boolean hasGesture() { return request.hasGesture(); }
                @Override public String getMethod() { return request.getMethod(); }
                @Override public Map<String, String> getRequestHeaders() { return request.getRequestHeaders(); }
            });
        }
        return super.shouldInterceptRequest(view, request);
    }
}
