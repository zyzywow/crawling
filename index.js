const express = require("express");
const cheerio = require("cheerio");
const axios = require("axios");
const cors = require("cors");
const puppeteer = require("puppeteer");
const app = express();

app.use(cors());
app.set("port", process.env.PORT || 8099);
const PORT = app.get("port");
app.get("/", (req, res) => {
  res.send("hello express222222");
});
app.get("/daum/news", (req, res) => {
  axios({
    url: "https://news.daum.net/",
  }).then((response) => {
    // console.log(response.data);
    const $ = cheerio.load(response.data);
    const newsList = $(".list_newsissue").children("li");
    const sendNewsList = [];
    newsList.each((idx, item) => {
      sendNewsList.push({
        title: $(item).find(".tit_g").text().replaceAll("\n", "").trim(),
        // trim()공백없애기, replaceAll() -불필요한것 제거
        img: $(item).find(".wrap_thumb .thumb_g").attr("src"),
        category: $(item).find(".txt_category").text(),
        company: $(item).find(".logo_cp .thumb_g").attr("src"),
        url: $(item).find(".tit_g a").attr("href"),
      });
    });
    // res.json(sendNewsList);
    res.send(sendNewsList);
  });
});

// 동적로딩 ssr(서버사이트렌더링)-서버에서 데이터 다 만들어내려주어 크롤링할때 데이터잘내려옴 / 음식다만들어서 제공해주는타입
// csr(클라이언트사이트렌더링)(vue,react) - 밀키트처럼 재료만내주어 내가요리해야하는타입 , 속도는빠름, axios로는 데이터 가져올수없음
// puppeteer(구글에서만든것) - 크롬에서만동작함.

// promise 비동기적실행을 동기적으로 처리할수있다.
// async 비동기적실행, await 순서대로 진행되길 기다리는.
app.get("/gmarket/:item", async (req, res) => {
  const item = req.params.item;
  const searchItem = encodeURIComponent(item); // 검색어 주소창에숫자&문자로변환
  console.log(item);
  const browser = await puppeteer.launch({
    headless: true,
    // false -> 파란구글창(구글개발자버젼)뜸
  });
  const page = await browser.newPage();
  await page.setViewport({
    width: 1920,
    height: 1080,
    // browser가 아닌 page의 크기고정resize해도 고정
  });
  await page.goto(`http://browse.gmarket.co.kr/search?keyword=${searchItem}`, { waitUntil: "load" });

  await page.evaluate(async () => {
    //페이지에게 일을시킬수있음.
    // console.log(document.body.scrollHeight);
    const scrollHeight = document.body.scrollHeight;
    const aa = await new Promise((resolve, reject) => {
      const amount = 200;
      let total = 0;
      const timer = setInterval(() => {
        window.scrollBy(0, amount);
        total += amount;
        if (total > scrollHeight) {
          clearInterval(timer);
          resolve("end");
        }
      }, 50);
    });
    console.log(aa);
  });

  const content = await page.content();
  const $ = cheerio.load(content);
  const items = $(".box__component-itemcard");
  const sendItemsArray = [];

  items.each((idx, item) => {
    const title = $(item).find(".text__item").text();
    const sPrice = $(item).find(".box__price-seller .text__value").text();
    const oPrice = $(item).find(".box__price-original .text__value").text();
    const count = $(item).find(".list-item__pay-count").text();
    const img = $(item).find(".image__item").attr("src");
    const free = $(item).find(".text__tag img").attr("src");

    const url = $(item).find(".link__item").attr("href");
    sendItemsArray.push({ title, sPrice, oPrice, img, url, free, count });
    // key와value값이 같으면 생략해서 하나만 써도 됌,ex)title:title

    // console.log(img);
  });
  res.json(sendItemsArray);
});
// stateless - s,c의 한번의요청,한번의응답, 유지하지않음
// socket() - s,c 요청응답이 끊기지않고 유지,한번꽂아놓으면 계속유지가됌,stateful
app.get("/musinsa", async (req, res) => {
  // const item = req.params.item;
  // const searchItem = encodeURIComponent(item); // 검색어 주소창에숫자&문자로변환
  // console.log(item);
  const browser = await puppeteer.launch({
    headless: true,
    // false -> 파란구글창(구글개발자버젼)뜸
  });
  const page = await browser.newPage();
  await page.setViewport({
    width: 1920,
    height: 100,
  });
  await page.goto("https://www.musinsa.com/category/001", { waitUntil: "load" });

  const content = await page.content();
  const $ = cheerio.load(content);
  const items = $(".list").children("li");

  // console.log(items);

  const sendItemsArray = [];
  items.each((idx, item) => {
    const img = $(item).find(".img-block > img").attr("src");
    const company = $(item).find(".article_info .item_title").text();
    const title = $(item).find(".article_info p a").text();
    // const del = $(item).find(".article_info .price del").text();
    const price = $(item).find(".article_info .price").text();

    // const aa = $(item).find(".article_info .price").text();
    const del = $(item).find(".article_info .price").remove().trim();

    // const aa = $("#ttt del").text();
    // const bb = $("#ttt del").remove();
    console.log(aa);
    console.log($("#ttt").text().trim());
    sendItemsArray.push({ title, img, price, company, del });
    // key와value값이 같으면 생략해서 하나만 써도 됌,ex)title:title
    // console.log(img);
  });
  res.json(sendItemsArray);
});

app.listen(PORT, () => {
  console.log(`${PORT}에서 서버 대기중`);
});
