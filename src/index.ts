require("dotenv").config();
import { Logger } from "@hocuspocus/extension-logger";
import { Server } from "@hocuspocus/server";
import { slateNodesToInsertDelta } from "@slate-yjs/core";
import { encodeStateAsUpdate, XmlText } from "yjs";
import { makePrivateKeySigner, FdpStoragePersistence } from "y-fdp-storage";
import { Bee, Utils } from "@ethersphere/bee-js";
import express from "express";
import expressWebsockets from "express-ws";
import bodyParser from "body-parser";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";
import { Database } from "@hocuspocus/extension-database";

// Postage Batch ID and Secret Key
const postageBatchId = process.env.BEE_POSTAGE;
const secretKey = process.env.BEE_SECRET_KEY;

// Bee client
const bee = new Bee(process.env.BEE_URL);

// Initial value
const initialValue = [{ type: "paragraph", children: [{ text: "" }] }];

// Creates a new y-fdp-storage persistence object
const createYStorageProvider = (
  req: express.Request<
    ParamsDictionary,
    any,
    any,
    ParsedQs,
    Record<string, any>
  >
) => {
  const wallet = makePrivateKeySigner(Utils.hexToBytes(secretKey));
  const topic = req.params.topic;

  // Create FdpStoragePersistence object
  const persistence = new FdpStoragePersistence(
    bee,
    wallet,
    topic,
    postageBatchId
  );

  return persistence;
};

// Creates a new Y Websocket Server
const createWsServer = (storeProvider: FdpStoragePersistence) => {
  const server = Server.configure({
    extensions: [
      new Logger(),
      new Database({
        fetch: async ({ documentName }) => {
          return storeProvider.read();
        },
        store: async (arg) => {
          const update = encodeStateAsUpdate(arg.document);
          await storeProvider.store(update);
        },
      }),
    ],

    async onLoadDocument(data) {
      // Load the initial value in case the document is empty
      if (data.document.isEmpty("content")) {
        const insertDelta = slateNodesToInsertDelta(initialValue);
        const sharedRoot = data.document.get("content", XmlText);

        // @ts-ignore - Yjs types are not up to date
        sharedRoot.applyDelta(insertDelta);
      }
      return data.document;
    },
  });

  server.enableMessageLogging();

  return server;
};

const { app } = expressWebsockets(express());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Websocket endpoint
app.ws("/topic/:topic", (websocket, request) => {
  const context = {};
  const server = createWsServer(createYStorageProvider(request));
  server.handleConnection(websocket, request, context);
});

// Start the server
app.listen(process.env.PORT || 9028, () =>
  console.log(`Listening on http://127.0.0.1:${process.env.PORT}`)
);
