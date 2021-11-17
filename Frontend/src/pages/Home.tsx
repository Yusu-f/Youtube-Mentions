import React, { createRef, ReactElement } from "react";
import {
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonLabel,
  IonPage,
  IonRow,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonFooter,
  isPlatform,
  IonPopover,
  IonIcon,
} from "@ionic/react";
import { heart } from "ionicons/icons"

import Row from "../components/Row";

import "./Home.css";

import axios from "axios";
import Footer from "../components/Footer";

interface IProps { }
interface IState {
  stocksArray: stocks[];
  cryptoArray: crypto[];
  disableInfiniteScroll: boolean;
  allStocksLoaded: boolean,
  allCryptoLoaded: boolean,
  stockOffset: number;
  cryptoOffset: number;
  mode: string | undefined;
  flipped: boolean;
  showPopover: boolean;
  event: any;
}

type stocks = {
  company: string;
  count: number;
  ticker: string;
};

type crypto = {
  company: string;
  count: number;
  ticker: string;
  crypto: string;
};

class Home extends React.Component<IProps, IState> {
  state: IState = {
    stocksArray: [],
    cryptoArray: [],
    disableInfiniteScroll: false,
    allStocksLoaded: false,
    allCryptoLoaded: false,
    stockOffset: 0,
    cryptoOffset: 0,
    mode: "stocks",
    flipped: false,
    showPopover: false,
    event: undefined,
  };

  async componentDidMount() {
    await this.fetchData();
  }

  async fetchData() {
    let itemsPerRequest = 20;

    const stocks_url: string = `https://DB-URL.firebaseio.com/all-mentions/stocks/mentions.json?orderBy="$key"&limitToFirst=${itemsPerRequest}&startAt="${this.state.stockOffset}"`;
    const crypto_url: string = `https://DB-URL.firebaseio.com/all-mentions/crypto/mentions.json?orderBy="$key"&limitToFirst=${itemsPerRequest}&startAt="${this.state.cryptoOffset}"`;

    const stocks: Response = await fetch(stocks_url);
    const crypto: Response = await fetch(crypto_url);
    // console.log(res);

    stocks
      .json()
      .then(async (res) => {
        console.log(res);

        if (!Array.isArray(res)) {
          let resArray = [];
          for (let key in res) {
            resArray.push(res[key]);
          }
          res = resArray;
        }

        res = res.filter((x: any) => x !== null);
        // console.log(res.length);

        if (res) {
          this.setState((prevState) => {
            return {
              stocksArray: [...prevState.stocksArray, ...res].sort((a, b) => b.count - a.count),
              stockOffset: prevState.stockOffset + itemsPerRequest,
              allStocksLoaded: res.length < itemsPerRequest,
            };
          });
        }
      })
      .catch((err) => console.error(err));

    //load crypto  
    crypto
      .json()
      .then(async (res) => {
        // console.log(res);

        if (!Array.isArray(res)) {
          let resArray = [];
          for (let key in res) {
            resArray.push(res[key]);
          }
          res = resArray;
        }

        res = res.filter((x: any) => x !== null);
        // console.log(res.length);

        if (res) {
          this.setState((prevState) => {
            return {
              cryptoArray: [...prevState.cryptoArray, ...res].sort((a, b) => b.count - a.count),
              cryptoOffset: prevState.cryptoOffset + itemsPerRequest,
              allCryptoLoaded: res.length < itemsPerRequest,
            };
          });
        }
      })
      .catch((err) => console.error(err));

    if (this.state.allStocksLoaded && this.state.allCryptoLoaded) {
      this.setState({ disableInfiniteScroll: true })
    }
  }

  async searchNext(event: CustomEvent<void>) {
    await this.fetchData();

    (event.target as HTMLIonInfiniteScrollElement).complete();
  }

  render() {
    return (
      <IonPage style={{ overflowY: "scroll" }}>
        <IonHeader>
          <IonToolbar color="primary">
            <IonTitle>YoutubeMentions</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen>
          <IonGrid>
            <IonRow>
              {isPlatform("ios") ? (
                <IonSegment
                  value={this.state.mode}
                  id="ios-segment"
                  onIonChange={(e) => {
                    this.setState({ mode: e.detail.value });
                  }}
                >
                  <IonSegmentButton value="stocks">
                    <IonLabel>
                      <b>Stocks</b>
                    </IonLabel>
                  </IonSegmentButton>
                  <IonSegmentButton value="crypto">
                    <IonLabel>
                      <b>Crypto</b>
                    </IonLabel>
                  </IonSegmentButton>
                </IonSegment>
              ) : (
                <IonSegment
                  value={this.state.mode}
                  onIonChange={(e) => {
                    this.setState({ mode: e.detail.value });
                  }}
                >
                  <IonSegmentButton value="stocks">
                    <IonLabel>
                      <b>Stocks</b>
                    </IonLabel>
                  </IonSegmentButton>
                  <IonSegmentButton value="crypto">
                    <IonLabel>
                      <b>Crypto</b>
                    </IonLabel>
                  </IonSegmentButton>
                </IonSegment>
              )}
            </IonRow>
          </IonGrid>
          <div className="content">
            <div className="container">
              <div className="table-responsive custom-table-responsive">
                <table className="table custom-table">
                  <thead>
                    <tr>
                      <th scope="col">
                        Ticker
                        <div
                          style={{
                            display: "inline-flex",
                            flexDirection: "column",
                          }}
                        ></div>
                      </th>
                      <th scope="col">
                        Name
                        <div
                          style={{
                            display: "inline-flex",
                            flexDirection: "column",
                          }}
                        ></div>
                      </th>
                      <th scope="col">
                        Mentions
                        <div
                          // onClick={this.sort.bind(this)}
                          style={{
                            display: "inline-flex",
                            flexDirection: "column",
                          }}
                        >
                        </div>
                      </th>
                      <th scope="col">Period</th>
                    </tr>
                  </thead>
                  <tbody>
                    {this.state[this.state.mode == "stocks" ? "stocksArray" : "cryptoArray"]
                      .map((item: stocks | crypto, i: number) => {
                        return (
                          <Row
                            key={i}
                            ticker={item.ticker.toUpperCase()}
                            name={item.company.toUpperCase()}
                            mentions={item.count}
                            time={1}
                          />
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <IonInfiniteScroll
            threshold="100px"
            disabled={this.state.disableInfiniteScroll}
            onIonInfinite={(e: CustomEvent<void>) => this.searchNext(e)}
          >
            <IonInfiniteScrollContent loadingText="Loading..."></IonInfiniteScrollContent>
          </IonInfiniteScroll>
        </IonContent>
        <Footer />
      </IonPage>
    );
  }
}

export default Home;
