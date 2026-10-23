package com.cashaba.app;

import android.content.Context;
import android.os.Bundle;
import android.os.CancellationSignal;
import android.os.ParcelFileDescriptor;
import android.print.PageRange;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Use Android's print / Save as PDF UI instead of a WebView popup. */
@CapacitorPlugin(name = "CashaBaPrint")
public class CashaBaPrintPlugin extends Plugin {
    @PluginMethod
    public void print(PluginCall call) {
        String html = call.getString("html");
        String title = call.getString("title", "Casha-Ba Financial Report");
        if (html == null || html.isEmpty()) {
            call.reject("A report is required.");
            return;
        }
        getActivity().runOnUiThread(() -> {
            WebView report = new WebView(getActivity());
            report.getSettings().setJavaScriptEnabled(false);
            report.getSettings().setAllowFileAccess(false);
            report.getSettings().setAllowContentAccess(false);
            report.setWebViewClient(new WebViewClient() {
                private boolean opened;
                @Override
                public void onPageFinished(WebView view, String url) {
                    if (opened) return;
                    opened = true;
                    try {
                        PrintManager manager = (PrintManager) getActivity().getSystemService(Context.PRINT_SERVICE);
                        if (manager == null) throw new IllegalStateException("Printing is unavailable.");
                        PrintDocumentAdapter delegate = report.createPrintDocumentAdapter(title);
                        PrintDocumentAdapter adapter = new PrintDocumentAdapter() {
                            @Override public void onStart() { delegate.onStart(); }
                            @Override public void onLayout(PrintAttributes oldAttributes, PrintAttributes newAttributes,
                                CancellationSignal cancellation, LayoutResultCallback callback, Bundle extras) {
                                delegate.onLayout(oldAttributes, newAttributes, cancellation, callback, extras);
                            }
                            @Override public void onWrite(PageRange[] pages, ParcelFileDescriptor destination,
                                CancellationSignal cancellation, WriteResultCallback callback) {
                                delegate.onWrite(pages, destination, cancellation, callback);
                            }
                            @Override public void onFinish() {
                                delegate.onFinish();
                                report.destroy();
                            }
                        };
                        manager.print(title, adapter, new PrintAttributes.Builder()
                            .setMediaSize(PrintAttributes.MediaSize.ISO_A4).build());
                        call.resolve();
                    } catch (Exception error) {
                        report.destroy();
                        call.reject("The Android print dialog could not be opened.", error);
                    }
                }
            });
            report.loadDataWithBaseURL(null, html, "text/html", "UTF-8", null);
        });
    }
}
