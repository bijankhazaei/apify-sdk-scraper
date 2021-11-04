const Apify = require("apify");

const webSites = [
  {
    domain: "ebay",
    title: "#itemTitle",
    price: "#prcIsum",
    image_link: "#icImg",
  },
];

const createCrawler = async (url, title, price, image) => {
  const hostname = new URL(url).hostname;

  const requestList = await Apify.openRequestList("my-request-list", [url]);

  let titleSelector = title ?? ".title";
  let priceSelector = price ?? ".price";
  let imageLinkSelector = image ?? ".product-image";

  webSites.forEach((elm, index) => {
    console.log("elm :", elm);
    if (hostname.indexOf(elm.domain) > 0) {
      titleSelector = elm.title;
      priceSelector = elm.price;
      imageLinkSelector = elm.image_link;
    }
  });
  return new Apify.PuppeteerCrawler({
    requestList,
    handlePageFunction: async ({ page, request }) => {
      await Apify.pushData({
        title: await page.title(),
        productTitle: await page.$eval(titleSelector, (el) => el.textContent),
        price: await page.$eval(priceSelector, (el) => el.textContent),
        image_link: await page.$eval(priceSelector, (elm) => {
          return elm.getAttribute("src");
        }),
        url: request.url,
        succeeded: true,
      });
    },
    handleFailedRequestFunction: async ({ request }) => {
      await Apify.pushData({
        url: request.url,
        succeeded: false,
        errors: request.errorMessages,
      });
    },
  });
};

module.exports = {
  createCrawler,
};
