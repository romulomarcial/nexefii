const http = require("http");
const PORT = 3000;
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Test OK\n");
});
server.listen(PORT, "127.0.0.1", () => console.log(`http://localhost:${PORT}/`));
server.on("error", (err) => { console.error(err); process.exit(1); });
