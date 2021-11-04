const Apify = require("apify");
const express = require("express");
const bodyParser = require("body-parser");
const shops = require("./util/shops");
const { body, validationResult } = require("express-validator");
require("dotenv").config();

// Create ExpressJS app and configure body parsers that will allow us to receive form submissions.
const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//  Now we need to read following environment variables:
// - APIFY_CONTAINER_PORT  contains a port number where we must start server
// - APIFY_CONTAINER_URL  contains a URL under which we can access the container
// - APIFY_DEFAULT_KEY_VALUE_STORE_ID is simply ID of default key-value store of this
//   actor where we can store screenshots
const { APIFY_LOCAL_STORAGE_DIR, APIFY_DEFAULT_KEY_VALUE_STORE_ID } =
  process.env;

// Create an array of the processed URLs where n-th URL has its screenshot stored under the
// key [n].jpg in key-value store:
const processedUrls = [];

// Root path displays a HTML form to submit new URL and thumbnails of processed URLs:
app.get("/", async (req, res) => {
  const pageHtml = `
    <html>
    <head><title>Apify</title></head>
    <body>
        Hi There!
    </body>
    </html>`;

  res.send(pageHtml);
});

// POST route allowing us to submit new URLs. After URL is processed
// it redirects user back to root path.
app.post("/scrap", body("url").isURL(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { url, title, price, image } = req.body;

  if (url && title && price && image) {
    const crawler = await shops.createCrawler(url, title, price, image);

    await crawler.run();

    const dataset = await Apify.openDataset("default");

    const data = await dataset.getData();

    res.send(data.items[0] ?? {});

    await dataset.drop();

    await (await Apify.openKeyValueStore()).drop();
  } else {
    res.send("input with error");
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
