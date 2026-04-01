$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8080/")
$listener.Start()
Write-Host "Server started on http://localhost:8080"

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response
    $path = $request.Url.LocalPath
    if ($path -eq "/") { $path = "/index.html" }
    $filePath = Join-Path "c:\Users\User\desa" ($path.TrimStart("/").Replace("/","\"))
    try {
        if (Test-Path $filePath) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $ext = [System.IO.Path]::GetExtension($filePath)
            $ct = switch ($ext) {
                ".html" { "text/html;charset=utf-8" }
                ".css"  { "text/css;charset=utf-8" }
                ".js"   { "application/javascript;charset=utf-8" }
                ".png"  { "image/png" }
                ".jpg"  { "image/jpeg" }
                ".webp" { "image/webp" }
                default { "application/octet-stream" }
            }
            $response.ContentType = $ct
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $msg = [System.Text.Encoding]::UTF8.GetBytes("Not Found: $filePath")
            $response.OutputStream.Write($msg, 0, $msg.Length)
        }
    } catch {
        $response.StatusCode = 500
    } finally {
        $response.Close()
    }
}
