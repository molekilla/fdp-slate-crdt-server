# fdp-slate-crdt-server
Yjs CRDT Server for fdp-slate

## About Yjs CRDT Server

This repo contains a web socket server using Express and Hocuspocus to enable a `y-fdp-storage` persistence extension for Yjs applications. In this use case, we integrate Yjs CRDT Server for `fdp-slate`, which enables rich text editing functionality backed by FDP technology.

## Installation

1. Run `npm install`
2. Run `npm run build`
3. Run `npm run start`

## Configuration

### Environment variables

#### BEE_SECRET_KEY

Signer Secret Key

#### BEE_URL

Bee node url


#### BEE_POSTAGE

Postage stamp id

#### PORT

Server port

## Usage

Start Yjs CRDT server and in a separate terminal start `fdp-slate` client (using `crdt-slate` branch). Be sure to configure the websocket url to include topic.

> ws://localhost:9028/topic/crdt-document

## How it works

The server looks up any existing data stored in the feed using the topic. If no data is found, the document is initialized with a default value and a Y Shared Type is used to sync between client and server.

## Maintainer

@molekilla

## License

Apache 2.0
