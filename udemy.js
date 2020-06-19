const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const credsFile = process.argv[2];
const query = process.argv[3]
const urlInstagram = "https://www.udemy.com/"
let scrapedData = [];

(async function(){

    // read and parse credentials.json
    let data = await fs.promises.readFile(credsFile, "utf-8");
    let credentials = JSON.parse(data);
    email = credentials.email;
	password = credentials.pwd;

	// launch browser
	let browser = await puppeteer.launch({
		headless: false,
		defaultViewport: null,
		args: ["--disable-notifications", "--start-maximized"],
	});

	let numberOfPages = await browser.pages();
	let tab = numberOfPages[0];

	// goto Instagram Homepage
	await tab.goto(urlInstagram, {
		waitUntil: "networkidle2",
    });
    let query = "javascript"
    
    console.log("udemy opened")

    // await login(tab, email, password);

    // console.log("login successful");


    // await search(tab, "javascript");
    // console.log("searched")

    await getFreeCourses(tab, email, password, query);
    console.log("clicked on Free courses");

})();

// Function to login into the Udemy account
async function login(tab, email, password){

    delay(1000);
   try{ 
       let loginBtnSelector = 'button.btn.btn-quaternary[data-purpose="header-login"]'
        await tab.waitForSelector(loginBtnSelector, {timeout: 2000})
        await tab.click(loginBtnSelector)
        delay(2000);

        await tab.waitForSelector('input[name="email"]')
        await tab.type('input[name="email"]', email, {delay: 100})
        delay(1000);
    
        await tab.waitForSelector('input[name="password"]')
        await tab.type('input[name="password"]', password, {delay: 100});
    
        await navigationHelper(tab, '#submit-id-submit');
    
    } catch {
        let loginBtnSelector = 'a[href="https://www.udemy.com/join/login-popup/?locale=en_US&response_type=html&next=https%3A%2F%2Fwww.udemy.com%2F"]'
        await tab.waitForSelector(loginBtnSelector)
        await navigationHelper(tab, loginBtnSelector)
        delay(1000);
        
        await tab.waitForSelector('input[name="email"]')
        await tab.type('input[name="email"]', email, {delay: 100})
        delay(1000);

        await tab.waitForSelector('input[name="password"]')
        await tab.type('input[name="password"]', password, {delay: 100});

        await navigationHelper(tab, '#submit-id-submit');
    }
}

// Function to search a query in the search bar
async function search(tab, query){
    try{    
        delay(1000);
        await tab.waitForNavigation('#header-search-field', {timeout:2000})
        await tab.click('#header-search-field')
        await tab.type('#header-search-field', query, {delay: 100})
        await tab.click('button.btn.btn-link[type="submit"]')
        
    } catch {

        delay(1000);
        let searchSelector = 'div[data-purpose="header"] input[placeholder="Search for anything"]'
        await tab.waitForNavigation(searchSelector,{timeout:2000})
        await tab.click(searchSelector)
        await tab.type(searchSelector, query, {delay: 100})
        await tab.click('div[data-purpose="header"] button[type="submit"]')
    } finally {
        await tab.goto(`https://www.udemy.com/courses/search/?q=${query}`, {
            waitUntil: "networkidle2",
        });
    }
}

// Function to get the courses from the web page
async function getFreeCourses(tab, email, password, query){
    
    // query = "python"
    await tab.goto(`https://www.udemy.com/courses/search/?q=${query}`, {
        waitUntil: "networkidle2",
    });
    await tab.waitForSelector('#filter-form > div > div:nth-child(4) > label')
    await tab.click('#filter-form > div > div:nth-child(4) > label')

    var freeCheckBox = '#filter-form > div > div:nth-child(4) > div > div > div > div > div > fieldset > label:nth-child(2) > input'
    freeCheckBox = '#filter-form > div > div:nth-child(4) > div > div > div > div > div > fieldset > label:nth-child(2) > input[type="checkbox"]'
    
    await tab.evaluate((freeCheckBox) => {
        document.querySelector(freeCheckBox).click();
    }, freeCheckBox);
    
    
    for(let i = 1; i <= 2; i++){
        delay(500);
        await tab.goto(`https://www.udemy.com/courses/search/?q=${query}&p=${i}`, {
            waitUntil: "networkidle2",
        });
        let data = await scraper(tab);
            scrapedData.push({"courses": data});

    }
    console.log(scrapedData);
    await fs.promises.writeFile(
		"watchNext2.json",
		JSON.stringify(scrapedData, null, 4)
	);
}

// Funciton to scrape courses from the site
async function scraper(tab){

    let data = await tab.$$eval('.course-list--container--3zXPS > div:not(.search--unit-injection--1bANP) a[data-purpose="container"]', 
    (courses) => {

        let result = courses.map(course => {
            let title = course.querySelector("div > :nth-child(1)").innerText;
            let description = course.querySelector("div > :nth-child(2)").innerText;
            let tutor = course.querySelector("div > :nth-child(3)").innerText;
            let rating = course.querySelector("div > :nth-child(4)").innerText;
            let duration = course.querySelector("div > :nth-child(5) > span:nth-child(1)").innerText;
            let lectures = course.querySelector("div > :nth-child(5) > span:nth-child(2)").innerText;
            let difficulty = course.querySelector("div > :nth-child(5) > span:nth-child(3)").innerText;
            let link = "https://www.udemy.com" + course.getAttribute('href');

            return {
            title,
            description,
            tutor,
            rating,
            duration,
            lectures,
            difficulty,
            link
            } 
        });
        return result
    })
    return data;
    
}

// helper function for navigation
async function navigationHelper(tab, selector) {
	await Promise.all([
		tab.waitForNavigation({
			waitUntil: "networkidle2",
		}),
		tab.click(selector),
	]);
}

// delay function
function delay(time) {
	return new Promise(function (resolve) {
		setTimeout(resolve, time);
	});
}