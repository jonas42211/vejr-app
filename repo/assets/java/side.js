import { startWeatherApp } from "./weatherController.js";

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js");
  console.log("App: service worker registered");
}

startWeatherApp();
