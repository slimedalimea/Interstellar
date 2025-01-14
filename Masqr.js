import fs from "node:fs";
import path from "node:path";
import fetch from "node-fetch";

const LICENSE_SERVER_URL = "https://masqr.gointerstellar.app/validate?license=";
const Fail = fs.readFileSync("Failed.html", "utf8");

export function setupMasqr(app) {
  app.use(async (req, res, next) => {
    // Skip authentication for index.html or /
    if (req.url === "/" || req.url === "/index.html") {
      next();
      return;
    }

    // Skip authentication for /ov/ routes
    if (req.url.includes("/ov/")) {
      next();
      return;
    }

    const authheader = req.headers.authorization;

    // Allow requests with valid authcheck cookie
    if (req.cookies["authcheck"]) {
      next();
      return;
    }

    // Handle refresh check cookie logic
    if (req.cookies["refreshcheck"] !== "true") {
      res.cookie("refreshcheck", "true", { maxAge: 10000 });
      MasqFail(req, res);
      return;
    }

    // Require authorization header
    if (!authheader) {
      res.setHeader("WWW-Authenticate", "Basic");
      res.status(401);
      MasqFail(req, res);
      return;
    }

    // Validate license using external service
    const auth = Buffer.from(authheader.split(" ")[1], "base64")
      .toString()
      .split(":");
    const pass = auth[1];

    try {
      const licenseCheckResponse = await fetch(
        LICENSE_SERVER_URL + pass + "&host=" + req.headers.host
      );
      const licenseCheck = (await licenseCheckResponse.json())["status"];
      console.log(
        LICENSE_SERVER_URL + pass + "&host=" + req.headers.host + " returned " + licenseCheck
      );

      if (licenseCheck === "License valid") {
        // Set authcheck cookie for valid licenses
        res.cookie("authcheck", "true", {
          expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        });
        res.send("<script> window.location.href = window.location.href </script>");
        return;
      }

      MasqFail(req, res);
    } catch (error) {
      console.error(error);
      MasqFail(req, res);
    }
  });
}

async function MasqFail(req, res) {
  if (!req.headers.host) {
    return;
  }
  const unsafeSuffix = req.headers.host + ".html";
  const safeSuffix = path.normalize(unsafeSuffix).replace(/^(\.\.(\/|\\|$))+/, "");
  const safeJoin = path.join(process.cwd() + "/Masqrd", safeSuffix);

  try {
    await fs.promises.access(safeJoin);
    const FailLocal = await fs.promises.readFile(safeJoin, "utf8");
    res.setHeader("Content-Type", "text/html");
    res.send(FailLocal);
  } catch (e) {
    res.setHeader("Content-Type", "text/html");
    res.send(Fail);
  }
}
