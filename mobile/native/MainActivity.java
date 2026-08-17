package io.github.springi790.etik;

import android.annotation.SuppressLint;
import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.Settings;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

import java.io.File;

public class MainActivity extends BridgeActivity {
    private String pendingUpdateUrl;
    private long updateDownloadId = -1L;
    private BroadcastReceiver updateReceiver;

    @Override
    @SuppressLint("SetJavaScriptEnabled")
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WebView webView = getBridge().getWebView();
        webView.addJavascriptInterface(new EtikAndroidInterface(this, webView), "EtikAndroid");
    }

    @Override
    public void onResume() {
        super.onResume();
        if (pendingUpdateUrl != null && canInstallPackages()) {
            String url = pendingUpdateUrl;
            pendingUpdateUrl = null;
            startUpdateDownload(url);
        }
    }

    @Override
    public void onDestroy() {
        if (updateReceiver != null) {
            try { unregisterReceiver(updateReceiver); } catch (Exception ignored) {}
            updateReceiver = null;
        }
        super.onDestroy();
    }

    private void printCurrentPage(WebView webView) {
        PrintManager printManager = (PrintManager) getSystemService(Context.PRINT_SERVICE);
        if (printManager == null) return;
        String jobName = "Etik · Etiqueta";
        PrintDocumentAdapter adapter = webView.createPrintDocumentAdapter(jobName);
        PrintAttributes attributes = new PrintAttributes.Builder().build();
        printManager.print(jobName, adapter, attributes);
    }

    private boolean canInstallPackages() {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.O || getPackageManager().canRequestPackageInstalls();
    }

    private void requestUpdateInstall(String rawUrl) {
        Uri uri;
        try { uri = Uri.parse(rawUrl); } catch (Exception error) { return; }
        if (!"https".equalsIgnoreCase(uri.getScheme())) return;
        String host = uri.getHost();
        if (host == null || !(host.equals("github.com") || host.endsWith(".githubusercontent.com"))) return;

        if (!canInstallPackages() && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            pendingUpdateUrl = rawUrl;
            Intent settingsIntent = new Intent(
                Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                Uri.parse("package:" + getPackageName())
            );
            startActivity(settingsIntent);
            return;
        }
        startUpdateDownload(rawUrl);
    }

    private void startUpdateDownload(String url) {
        DownloadManager manager = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
        if (manager == null) return;

        File destination = new File(getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), "Etik-update.apk");
        if (destination.exists()) destination.delete();

        DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
        request.setTitle("Actualizando Etik");
        request.setDescription("Descargando la nueva versión de Etik");
        request.setMimeType("application/vnd.android.package-archive");
        request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
        request.setDestinationInExternalFilesDir(this, Environment.DIRECTORY_DOWNLOADS, "Etik-update.apk");

        updateDownloadId = manager.enqueue(request);
        registerUpdateReceiver(manager);
    }

    private void registerUpdateReceiver(DownloadManager manager) {
        if (updateReceiver != null) {
            try { unregisterReceiver(updateReceiver); } catch (Exception ignored) {}
        }
        updateReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                long id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1L);
                if (id != updateDownloadId) return;
                Uri apkUri = manager.getUriForDownloadedFile(updateDownloadId);
                if (apkUri == null) return;
                Intent installIntent = new Intent(Intent.ACTION_VIEW);
                installIntent.setDataAndType(apkUri, "application/vnd.android.package-archive");
                installIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(installIntent);
            }
        };
        IntentFilter filter = new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(updateReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(updateReceiver, filter);
        }
    }

    private static class EtikAndroidInterface {
        private final MainActivity activity;
        private final WebView webView;

        EtikAndroidInterface(MainActivity activity, WebView webView) {
            this.activity = activity;
            this.webView = webView;
        }

        @JavascriptInterface
        public void printPage() {
            activity.runOnUiThread(() -> activity.printCurrentPage(webView));
        }

        @JavascriptInterface
        public void downloadAndInstallUpdate(String url) {
            activity.runOnUiThread(() -> activity.requestUpdateInstall(url));
        }
    }
}
