const axios = require("axios");
const fs = require("fs");
const CSV = require("@vanillaes/csv");

const { tickers } = require("./tickers.js");
const { transcript1 } = require("./transcript");
const { transcript2 } = require("./transcript");

const fetch = require("node-fetch");
const cheerio = require("cheerio");

const otc = require("../otc_tickers.json");
const nyse = require("../nyse_tickers.json");
const crypto = require("../crypto.json");

const stock_channels = require("../stock-ids.json");
const crypto_channels = require("../crypto-ids.json");

const cleanup = (transcriptArray, isCrypto) => {
  const tickerArray = [];
  const companyArray = [];

  const corrections = [
    { error: "NEO", correction: "NIO" },
    { error: "PALANCIER", correction: "PALANTIR" },
  ];

  transcriptArray.forEach((item, i) => {
    if (item.type == "ticker") {
      const splitString = item.content.split("");
      splitString.forEach((letter, i) => {
        if (letter == " " || letter == "-") {
          splitString.splice(i, 1);
        }
      });
      transcriptArray[i].content = splitString.join("");
      tickerArray.push({
        ticker: transcriptArray[i].content.toUpperCase(),
        company: "-",
      });
    } else {
      companyArray.push({
        ticker: "-",
        company: transcriptArray[i].content.toUpperCase(),
      });
    }

    const correction = corrections.find((val) => {
      return val.error == item.content;
    });
    if (correction) transcriptArray[i].content = correction.correction;
  });

  tickerArray.forEach((item, i) => {
    const correction = corrections.find((val) => {
      return val.error == item.ticker;
    });
    if (correction) tickerArray[i].ticker = correction.correction;
    let elem = nyse.find((i) => {
      // console.log(item);
      return i.ticker == item.ticker && i.ticker.length == item.ticker.length;
    });
    if (elem) {
      tickerArray[i].company = elem.company;
    } else {
      elem = otc.find((i) => {
        return i.ticker == item.ticker && i.ticker.length == item.ticker.length;
      });
      if (elem) {
        tickerArray[i].company = elem.company;
      } else {
        elem = crypto.find((i) => {
          return (
            i.ticker == item.ticker && i.ticker.length == item.ticker.length
          );
        });
        if (elem) {
          tickerArray[i].crypto = elem.crypto;
        }
      }
    }
  });

  companyArray.forEach((item, i) => {
    const correction = corrections.find((val) => {
      return val.error == item.company;
    });
    if (correction) companyArray[i].company = correction.correction;
    let elem = nyse.find((i) => {
      return (" " + i.company + " ").match(" " + item.company + " ");
    });
    if (elem) {
      companyArray[i].ticker = elem.ticker;
      companyArray[i].company = elem.company;
    } else {
      elem = otc.find((i) => {
        return (i.company + " ").match(item.company);
      });
      if (elem) {
        companyArray[i].ticker = elem.ticker;
        companyArray[i].company = elem.company;
      } else {
        elem = crypto.find((i) => {
          return (i.crypto + " ").match(item.company);
        });
        if (elem) {
          companyArray[i].ticker = elem.ticker;
          companyArray[i].crypto = elem.crypto;
        }
      }
    }
  });

  const newTranscriptArray = companyArray.concat(tickerArray);
  const x = [];
  newTranscriptArray.forEach((obj) => {
    let exists = x.findIndex(
      (item) => item.ticker == obj.ticker && item.company == obj.company
    );
    if (obj.crypto) {
      exists = x.findIndex(
        (item) => item.ticker == obj.ticker && item.crypto == obj.crypto
      );
    }
    if (exists == -1) {
      x.push({ ...obj, count: 1 });
    } else {
      x[exists].count++;
    }
  });
  if (isCrypto) {
    x.forEach((obj) => {
      if (!obj.crypto) obj.crypto = "-";
    });
  }
  return x;
};

function test() {
  const allMentions = [
    [
      { ticker: "KRUS", company: "KURA SUSHI USA INC", count: 3 },
      { ticker: "-", company: "carbon admission", count: 1 },
      { ticker: "vet", company: "VERMILION ENERGY INC", count: 5 },
      { ticker: "v", company: "VISA INC", count: 3 },
      { ticker: "vtho", company: "-", count: 17 },
      { ticker: "bmw", company: "-", count: 1 },
      { ticker: "PLTR", company: "PALANTIR TECH INC", count: 3 },
      { ticker: "pfin", company: "P & F INDUSTRIES INC", count: 20 },
      { id: "DqCGqwf1twM" },
    ],
    [
      { ticker: "-", company: "copen", count: 1 },
      { ticker: "PLTR", company: "PALANTIR TECH INC", count: 2 },
      { ticker: "-", company: "palancier", count: 1 },
      { ticker: "-", company: "venezuela", count: 1 },
      { ticker: "-", company: "credit suisse", count: 1 },
      { ticker: "COIN", company: "COINBASE GLOBAL INC", count: 3 },
      { ticker: "-", company: "voyager digital", count: 1 },
      { ticker: "VYGR", company: "VOYAGER THERAPEUTICS INC", count: 6 },
      { ticker: "-", company: "reddit", count: 1 },
      { ticker: "kopn", company: "KOPIN CORP", count: 1 },
      {
        ticker: "ltrpb",
        company: "LIBERTY TRIPADVISOR HLDGS INC",
        count: 1,
      },
      { ticker: "pfin", company: "P & F INDUSTRIES INC", count: 2 },
      { ticker: "pltr", company: "PALANTIR TECH INC", count: 1 },
      { ticker: "aws", company: "-", count: 1 },
      { ticker: "vyg", company: "-", count: 1 },
      { ticker: "vf", company: "-", count: 1 },
      { ticker: "rsi", company: "RUSH STREET INTERACTIVE INC", count: 1 },
      { id: "WbF-rVB3J0A" },
    ],
  ];
  const allMentionsArrays = [
    [
      {
        company: "KURA SUSHI USA INC",
        count: 3,
        id: ["ch1.0", "ch1.1"],
        ticker: "KRUS",
      },
      { company: "carbon admission", count: 1, id: [Array], ticker: "-" },
      {
        company: "VERMILION ENERGY INC",
        count: 5,
        id: [Array],
        ticker: "vet",
      },
      { company: "VISA INC", count: 3, id: [Array], ticker: "v" },
      { company: "-", count: 17, id: [Array], ticker: "vtho" },
      { company: "-", count: 1, id: [Array], ticker: "bmw" },
      { company: "copen", count: 1, id: [Array], ticker: "-" },
      {
        company: "PALANTIR TECH INC",
        count: 2,
        id: [Array],
        ticker: "PLTR",
      },
      { company: "palancier", count: 1, id: [Array], ticker: "-" },
      { company: "venezuela", count: 1, id: [Array], ticker: "-" },
      { company: "credit suisse", count: 1, id: [Array], ticker: "-" },
      {
        company: "COINBASE GLOBAL INC",
        count: 3,
        id: [Array],
        ticker: "COIN",
      },
      { company: "voyager digital", count: 1, id: [Array], ticker: "-" },
      {
        company: "VOYAGER THERAPEUTICS INC",
        count: 6,
        id: [Array],
        ticker: "VYGR",
      },
      { company: "reddit", count: 1, id: [Array], ticker: "-" },
      { company: "KOPIN CORP", count: 1, id: [Array], ticker: "kopn" },
      {
        company: "LIBERTY TRIPADVISOR HLDGS INC",
        count: 1,
        id: [Array],
        ticker: "ltrpb",
      },
      {
        company: "P & F INDUSTRIES INC",
        count: 2,
        id: [Array],
        ticker: "pfin",
      },
      {
        company: "PALANTIR TECH INC",
        count: 1,
        id: [Array],
        ticker: "pltr",
      },
      { company: "-", count: 1, id: [Array], ticker: "aws" },
      { company: "-", count: 1, id: [Array], ticker: "vyg" },
      { company: "-", count: 1, id: [Array], ticker: "vf" },
      {
        company: "RUSH STREET INTERACTIVE INC",
        count: 1,
        id: [Array],
        ticker: "rsi",
      },
      { channelId: "channel1" },
    ],
    [
      {
        company: "KURA SUSHI USA INC",
        count: 3,
        id: ["ch1.0", "ch2.1"],
        ticker: "KRUS",
      },
      { company: "carbon admission", count: 1, id: [Array], ticker: "-" },
      {
        company: "VERMILION ENERGY INC",
        count: 5,
        id: [Array],
        ticker: "vet",
      },
      { company: "VISA INC", count: 3, id: [Array], ticker: "v" },
      { company: "-", count: 17, id: [Array], ticker: "vtho" },
      { company: "-", count: 1, id: [Array], ticker: "bmw" },
      { channelId: "channel2" },
    ],
  ];
  const x = [];

  allMentionsArrays.forEach((mentionsArray) => {
    const channelId = mentionsArray[mentionsArray.length - 1].channelId;
    mentionsArray.forEach((mention) => {
      if (!mention.ticker && !mention.company) return;
      const exists = x.findIndex((item) => {
        return item.ticker == mention.ticker && item.company == mention.company;
      });
      if (exists == -1) {
        x.push({
          ...mention,
          id: [{ channelId: channelId, videoIds: mention.id }],
        });
      } else {
        x[exists].count += mention.count;
        x[exists].id.push({ channelId: channelId, videoIds: mention.id });
      }
    });
  });  
}

exports.getHomePage = async (req, res, next) => {
  // Getting youtube video caption from reverse-engineered API
  const getCaption = async (url) => {
    try {
      let caption = await axios.get(url);

      const html = caption.data;
      const $ = cheerio.load(html);
      const text = $("script")["39"].children[0].data;
      const param = text
        .split("serializedShareEntity")[1]
        .split(",")[0]
        .replace(/"/g, "")
        .split(":")[1];

      return fetch(
        "https://www.youtube.com/youtubei/v1/get_transcript?key=TRANSCRIPT_KEY",
        {
          headers: {
            accept: "*/*",
            "accept-language": "en-US,en;q=0.9",
            authorization:
              "SAPISIDHASH 1617352823_4deab3b8fe5c3e5e39a70a299a96e9aefb6c0b8e",
            "content-type": "application/json",
            "sec-ch-ua":
              '"Google Chrome";v="89", "Chromium";v="89", ";Not A Brand";v="99"',
            "sec-ch-ua-mobile": "?0",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "same-origin",
            "sec-fetch-site": "same-origin",
            "x-client-data":
              "CIy2yQEIpbbJAQjEtskBCKmdygEI+MfKAQi7+soBCLGaywEI5JzLAQipncsBCOmdywEIyJ/LARjgmssB",
            "x-goog-authuser": "0",
            "x-goog-visitor-id": "CgtTZ3M2cW1ZZTlLRSjgsJuDBg%3D%3D",
            "x-origin": "https://www.youtube.com",
            "x-youtube-client-name": "1",
            "x-youtube-client-version": "2.20210331.06.00",
            cookie:
              "HSID=AvKKIszZXPOo6PeFG; SSID=A-UBLT9I4vjhIaHJo; APISID=A17Fr-qbgnSxZj_m/AQ-ShI5Z5iloYHLH9; SAPISID=hS8qUUIlkTNw0P3Q/ACRKC4Enb4cEKHnT0; __Secure-3PAPISID=hS8qUUIlkTNw0P3Q/ACRKC4Enb4cEKHnT0; CONSENT=YES+NG.en+20161002-18-0; VISITOR_INFO1_LIVE=Sgs6qmYe9KE; LOGIN_INFO=AFmmF2swRQIgEeSVhZF8Xq156Et8YkHU6hY_Urr0DNZHQNj7eAHYkfgCIQCoewO4S2dBihZj_JZRRN9Y4CeWqZ5S1Mf-FggICxtSuw:QUQ3MjNmeU9xNWlLZ19OZ2FyemVTNk10dWNGZTZFelgyZ3I1cFkyMEZNUkpRNGdELU1DaVgwNklQOW5DMUE0bmpaVkhoTExoSFJyQ2Q2MnBJTkljLWlSMm9JOUxycHAxQ0dmdU5UVjdXWGppMENiQk5mRVlhNkV3VjlrQzZQRlI1aW5CTXowLVVSeHNoRUJCNlNMZ29XRUczc3dJWER2dEpB; PREF=tz=Africa.Lagos; _gcl_au=1.1.1549372048.1614120784; SID=8AcSSBJmb6Wq6T3zYuCv2bd52VRAfufKJ50KkMZzTto4a6Hu6p6QJHeN5Da6kLnLbymNpw.; __Secure-3PSID=8AcSSBJmb6Wq6T3zYuCv2bd52VRAfufKJ50KkMZzTto4a6Hu0-yNneRbE_31Vg4AhvZaBQ.; YSC=7C-OUjgs0ek; SIDCC=AJi4QfHjiI1fmhNRBR335qo_pAOGkVHhAaZxbvdxDWif63MqT5yDMpRvekagt17B4FR8Lp2D0g; __Secure-3PSIDCC=AJi4QfE6IqiephsCXilQlMincaya7GAktCDolx8nqGXmwzlqAEi0EhDwdRi0npL9YGw-5YD-o9c",
          },
          referrer: "https://www.youtube.com/watch?v=pC0yetSG6kU",
          referrerPolicy: "origin-when-cross-origin",
          body: `{"context":{"client":{"hl":"en","gl":"NG","remoteHost":"105.112.112.83","deviceMake":"","deviceModel":"","visitorData":"CgtTZ3M2cW1ZZTlLRSjgsJuDBg%3D%3D","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36,gzip(gfe)","clientName":"WEB","clientVersion":"2.20210331.06.00","osName":"Windows","osVersion":"10.0","originalUrl":"https://www.youtube.com/watch?v=pC0yetSG6kU","platform":"DESKTOP","clientFormFactor":"UNKNOWN_FORM_FACTOR","timeZone":"Africa/Lagos","browserName":"Chrome","browserVersion":"89.0.4389.90","screenWidthPoints":804,"screenHeightPoints":635,"screenPixelDensity":1,"screenDensityFloat":1,"utcOffsetMinutes":60,"userInterfaceTheme":"USER_INTERFACE_THEME_LIGHT","connectionType":"CONN_CELLULAR_4G","mainAppWebInfo":{"graftUrl":"https://www.youtube.com/watch?v=pC0yetSG6kU","webDisplayMode":"WEB_DISPLAY_MODE_BROWSER"}},"user":{"lockedSafetyMode":false},"request":{"useSsl":true,"internalExperimentFlags":[],"consistencyTokenJars":[]},"clientScreenNonce":"MC43NDY3NzY2MTk2MjQ3OTA5","clickTracking":{"clickTrackingParams":"CCAQ040EGAAiEwiKwbbZlN_vAhXX6lEKHeBvClU="},"adSignalsInfo":{"params":[{"key":"dt","value":"1617352801989"},{"key":"flash","value":"0"},{"key":"frm","value":"0"},{"key":"u_tz","value":"60"},{"key":"u_his","value":"6"},{"key":"u_java","value":"false"},{"key":"u_h","value":"768"},{"key":"u_w","value":"1366"},{"key":"u_ah","value":"738"},{"key":"u_aw","value":"1366"},{"key":"u_cd","value":"24"},{"key":"u_nplug","value":"3"},{"key":"u_nmime","value":"4"},{"key":"bc","value":"31"},{"key":"bih","value":"635"},{"key":"biw","value":"788"},{"key":"brdim","value":"0,0,0,0,1366,0,1366,738,804,635"},{"key":"vis","value":"1"},{"key":"wgl","value":"true"},{"key":"ca_type","value":"image"}],"bid":"ANyPxKqZikP2j9NI9Z3J3MmIFOKgYiwoIXtav5SmQbqxUqw08pDcRStmFH4VBYdSB_iYlPiqBT4r-B7F9krHckY95vW5MR22rQ"}},"params":"${param}"}`,
          method: "POST",
          mode: "cors",
        }
      )
        .then((res) => {
          return res.json();
        })
        .then((res) => {
          let text = "";
          res.actions[0].updateEngagementPanelAction.content.transcriptRenderer.body.transcriptBodyRenderer.cueGroups.forEach(
            (cueGroup) => {              
              text =
                text +
                cueGroup.transcriptCueGroupRenderer.cues[0]
                  .transcriptCueRenderer.cue.simpleText +
                "\n";
            }
          );
          fs.writeFileSync("caption.txt", text);
          return text;
        });
    } catch (err) {
      console.log(err);
    }
  };

  const getVideoInfo = async (id) => {
    const video = await axios.get(
      `https://youtube.googleapis.com/youtube/v3/videos?part=snippet&id=${id}&key=${process.env.YOUTUBE_API_KEY}`
    );
    let title = video.data.items[0].snippet.title;
    let description = video.data.items[0].snippet.description;
    return new Date(video.data.items[0].snippet.publishedAt);
  };

  const getChannelVideos = async (channelId) => {
    try {
      const channel = await axios.get(
        `https://youtube.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${process.env.YOUTUBE_API_KEY}`
      );
      const uploadsId =
        channel.data.items[0].contentDetails.relatedPlaylists.uploads;

      const videoIds = [];

      const getVideos = async (id, token) => {
        try {
          let videos;

          if (token) {
            videos = await axios.get(
              `https://www.googleapis.com/youtube/v3/playlistItems?playlistId=${id}&key=${process.env.YOUTUBE_API_KEY}&part=snippet&maxResults=50&pageToken=${token}`
            );
          } else {
            videos = await axios.get(
              `https://www.googleapis.com/youtube/v3/playlistItems?playlistId=${id}&key=${process.env.YOUTUBE_API_KEY}&part=snippet&maxResults=50`
            );
          }

          const newToken = videos.data.nextPageToken;
          const startDate = new Date().getTime() - (1000 * 60 * 60 * 24)

          let isDone = false;

          for (let i = 0; i < videos.data.items.length; i++) {
            const publishDate = new Date(
              videos.data.items[i].snippet.publishedAt
            );

            // If video was pubilshed earlier than 24 hrs ago, break loop
            if (startDate > publishDate) {
              isDone = true;
              break;
            }

            videoIds.push(videos.data.items[i].snippet.resourceId.videoId);
          }

          if (newToken && !isDone) {
            return await getVideos(id, newToken);
          } else {
            return videoIds;
          }
        } catch (err) {
          console.log(err);
        }
      };

      return await getVideos(uploadsId, null);
    } catch (err) {
      console.log(err);
    }
  };

  const getComments = async (url) => {
    const comments = await axios.get(url);
    console.log(comments.data.items[0].snippet.topLevelComment);
  };

  const getVideoPrediction = async (id, contentType) => {
    const predictionResults = [];

    try {
      ("use strict");

      let string;

      if (contentType == "bio") {
        string = await getVideoInfo(
          `https://youtube.googleapis.com/youtube/v3/videos?part=snippet&id=${id}&key=${process.env.YOUTUBE_API_KEY}`
        );
      } else {
        string = await getCaption(`https://www.youtube.com/watch?v=${id}`);
      }

      async function main(projectId, location, modelId, content) {
        // [START automl_language_entity_extraction_predict]
        /**
         * TODO(developer): Uncomment these variables before running the sample.
         */

        let remainder = "";

        // Imports the Google Cloud AutoML library
        const { PredictionServiceClient } = require("@google-cloud/automl").v1;

        // Instantiates a client
        const client = new PredictionServiceClient();

        if (content.length > 10000) {
          for (i = 9999; i >= 0; i--) {
            if (content.charAt(i) == " ") {
              remainder = content.slice(i);
              content = content.slice(0, i);
              break;
            }
          }
        }

        async function predict() {
          // Construct request
          const request = {
            name: client.modelPath(projectId, location, modelId),
            payload: {
              textSnippet: {
                content: content,
                mimeType: "text/plain", // Types: 'test/plain', 'text/html'
              },
            },
          };

          const [response] = await client.predict(request);

          for (const annotationPayload of response.payload) {
            if (annotationPayload.textExtraction.score >= 0.9) {
              const result = {
                type: annotationPayload.displayName,
                content: annotationPayload.textExtraction.textSegment.content,
              };
              predictionResults.push(result);
            }
          }
          // console.log(predictionResults);
        }

        await predict();
        // [END automl_language_entity_extraction_predict]

        if (remainder.length > 0) {
          return main(
            "PROJECT_ID",
            "us-central1",
            "ID",
            remainder
          );
        } else {
          return predictionResults;
        }
      }

      return main(
        "PROJECT_ID",
        "us-central1",
        "ID",
        string
      );
    } catch (err) {
      console.log(err);
    }
  };

  let scannedNum = 0

  const getChannelPredictions = async (channelId, isCrypto) => {
    console.log(`${channelId} scan begun`);
    try {
      const videos = await getChannelVideos(channelId);

      const scannedVidsArray = [];
      const allErrorsArray = [];

      const scannedVids = await axios.get(
        "https://PROJECT_ID-default-rtdb.firebaseio.com/scanned-vids.json"
      );
      for (let key in scannedVids.data) {
        scannedVidsArray.push(key);
      }

      const allErrors = await axios.get(
        `https://PROJECT_ID-default-rtdb.firebaseio.com/errors/${channelId}.json`
      );
      for (let key in allErrors.data) {
        allErrorsArray.push(key);
      }

      for (let i = 0; i < videos.length; i++) {
        let isScanned = scannedVidsArray.find((vidId) => {
          return vidId == videos[i];
        });
        if (isScanned) continue;
        let scanned = true;
        try {
          const predictionResults = await getVideoPrediction(
            videos[i],
            "caption"
          );
          const uploadDate = await getVideoInfo(videos[i]);
          const mentions = cleanup(predictionResults, isCrypto);    
          scannedNum += 1      

          //store on backend
          await axios.patch(
            `https://PROJECT_ID-default-rtdb.firebaseio.com/channel-mentions/${channelId}/${videos[i]}.json`,
            { mentions: mentions }
          );

          await axios.patch(
            `https://PROJECT_ID-default-rtdb.firebaseio.com/channel-mentions/${channelId}/${videos[i]}.json`,
            { uploadDate: uploadDate }
          );
        } catch (err) {
          let isAdded = allErrorsArray.find((error) => {
            return error == videos[i];
          });
          if (isAdded) continue;
          await axios.patch(
            `https://PROJECT_ID-default-rtdb.firebaseio.com/errors/${channelId}.json`,
            { [videos[i]]: true }
          );
          scanned = false;
          continue;
        }
        if (scanned)
          await axios.patch(
            `https://PROJECT_ID-default-rtdb.firebaseio.com/scanned-vids.json`,
            { [videos[i]]: true }
          );
      }
      console.log("channel scan complete");
    } catch (err) {
      console.log(err);
    }
  };

  updateAllMentions = async () => {
    console.log("updating all mentions");
    const allMentionsArray = [];
    let x = [];
    const date = new Date().getTime() - (1000 * 60 * 60 * 24)

    const allMentions = await axios.get(
      "https://PROJECT_ID-default-rtdb.firebaseio.com/channel-mentions.json"
    );

    for (let firstkey in allMentions.data) {
      for (let secondkey in allMentions.data[firstkey]) {
        if (
          date < new Date(allMentions.data[firstkey][secondkey].uploadDate)
        ) {
          allMentionsArray.push(
            ...allMentions.data[firstkey][secondkey].mentions
          );
        }
      }
    }

    allMentionsArray.forEach((obj) => {
      const exists = x.findIndex(
        (item) => item.ticker == obj.ticker && item.company == obj.company
      );
      if (exists == -1) {
        x.push(obj);
      } else {
        x[exists].count += obj.count;
      }
    });

    // console.log(x);
    x = x.sort((a, b) => b.count - a.count);
    x = x.filter(e => {
      if (e.company == "-" && e.count < 2 || e.ticker == "-" && e.count < 2) return false
      return true
    } )
    const stocksArray = x.filter(e => e.crypto == undefined)
    const cryptoArray = x.filter(e => e.crypto != undefined)

    await axios.put(
      `https://PROJECT_ID-default-rtdb.firebaseio.com/all-mentions/stocks.json`,
      { mentions: stocksArray }
    );

    await axios.put(
      `https://PROJECT_ID-default-rtdb.firebaseio.com/all-mentions/crypto.json`,
      { mentions: cryptoArray }
    );
    console.log("all mentions updated");
  };

  for (let i = 0; i < stock_channels.length; i++) {
    await getChannelPredictions(stock_channels[i], false);
  }

  for (let i = 0; i < crypto_channels.length; i++) {
    await getChannelPredictions(crypto_channels[i], true);
  }

  await updateAllMentions()
  console.log("Scanned all channels");
  console.log(scannedNum);
};

// Functions for getting stock tickers and names
exports.getData = async (req, response, next) => {
  const getNyseData = async () => {
    let instruments = [];
    let shouldLoop = true;

    try {
      for (let i = 1; i < 1000; i++) {
        if (shouldLoop) {
          let res = await fetch("https://www.nyse.com/api/quotes/filter", {
            headers: {
              accept: "*/*",
              "accept-language": "en-US,en;q=0.9",
              "content-type": "application/json",
              "sec-ch-ua":
                '" Not A;Brand";v="99", "Chromium";v="90", "Google Chrome";v="90"',
              "sec-ch-ua-mobile": "?0",
              "sec-fetch-dest": "empty",
              "sec-fetch-mode": "cors",
              "sec-fetch-site": "same-origin",
              cookie:
                "__cfduid=d3d14df8205bd22c2fb413697c894b16e1620221966; ICE_notification=479528458.56681.0000; OptanonAlertBoxClosed=2021-05-05T13:39:39.072Z; _ga=GA1.2.547282502.1620221979; _gid=GA1.2.1758348004.1620221979; JSESSIONID=9891EB46A9C46E6E01C284971DA26863; ICE=!9zEXOATzqgwf9mSQmW/NR4Un8KL87GFYnI9B+m+tth9fU+YVTopnqoeEF95Hhw0ZcF49fvAodURe9g==; TS01ebd031=0100e6d4950642e69a0db60c65c22ab869340539a7e7cec495066c313d309193bc8d0175a7e94ad64294f78df331107da68b1ece62396e04f3e03b4eba22431c02d30071e02defd6570e61a693f4d2d391e81b3c6b83a5a0f7981cfbd89bb8d260c5fab583; _gat_UA-97108014-2=1; OptanonConsent=isIABGlobal=false&datestamp=Wed+May+05+2021+14%3A51%3A58+GMT%2B0100+(West+Africa+Standard+Time)&version=6.16.0&hosts=&consentId=870c7ffa-b851-4aaf-b519-9a6e322e827f&interactionCount=1&landingPath=NotLandingPage&groups=C0001%3A1%2CC0005%3A1%2CC0004%3A1%2CC0003%3A1%2CC0002%3A1&geolocation=%3B&AwaitingReconsent=false",
            },
            referrer: "https://www.nyse.com/listings_directory/stock",
            referrerPolicy: "strict-origin-when-cross-origin",
            body: `{"instrumentType":"EQUITY","pageNumber":"${i}","sortColumn":"NORMALIZED_TICKER","sortOrder":"ASC","maxResultsPerPage":1000,"filterToken":""}`,
            method: "POST",
            mode: "cors",
          });
          res = await res.json();
          console.log(res);
          res.forEach((item) => {
            if (item.instrumentType == "COMMON_STOCK") {
              instruments.push({
                ticker: item.symbolExchangeTicker,
                company: item.instrumentName,
              });
            }
          });
          shouldLoop = !!res.length;
        } else {
          fs.writeFileSync("nyse_tickers.json", JSON.stringify(instruments));
          break;
        }
      }
    } catch (err) {
      console.log(err);
    }
  };

  const getOtcData = () => {
    let instruments = [];
    fs.readFile("otc_stocks.csv", "utf8", function (err, data) {
      if (err) {
        return console.log(err);
      }
      CSV.parse(data).forEach((row) => {
        instruments.push({ ticker: row[0], company: row[1] });
      });
      fs.writeFileSync("otc_tickers.json", JSON.stringify(instruments));
    });
  };

  const getCryptoData = async () => {
    const cryptos = [];
    let start = 1;

    while (true) {
      try {
        let res = await axios.get(
          "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest",
          {
            headers: {
              "X-CMC_PRO_API_KEY": "9e9baa7e-cab9-45b9-86c4-bf8833788758",
            },
            params: {
              start: `${start}`,
              limit: "5000",
            },
          }
        );
        res.data.data.forEach((obj) => {
          cryptos.push({ crypto: obj.name.toUpperCase(), ticker: obj.symbol });
        });
        start = res.data.data.length;
        if (res.data.data.length < 5000) break;
      } catch (err) {
        console.log(err);
      }
    }
    fs.writeFileSync("crypto.json", JSON.stringify(cryptos));
  };

  getNyseData();
  getOtcData();
  getCryptoData();
};
