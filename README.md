# Chat Experimental

> Never speak to another human again. Have incredibly sophisticated discussions with top tier models.

![image](https://github.com/user-attachments/assets/2c762b14-871d-49ec-acb1-fe432d45c5a9)

Simple chat client where multiple users can connect, create & join different channels, and chat with other users & AI models. Built using CloudFlare Durable Objects for websockets, [CloudFlare AI](https://ai.cloudflare.com/) for LLM inference, and [CloudFlare Workers](https://workers.cloudflare.com/) using the [Hono framework](https://hono.dev/) for a lightweight backend. The frontend is a simple [NextJS](https://nextjs.org/) app styled using [ShadCN UI](https://ui.shadcn.com/) components. Inspired by the example in 'Serverless Apps on Cloudflare', by Ashley Peacock. External commits welcome, especially ones that make the AI more enjoyable to chat with.

Not hosted on the web so I don't incur costs for LLM inference, but easily deployable on CloudFlare via their workers platform. To run this project yourself, do `pnpm run dev` in the frontend and server directories and go to `localhost:3000` to get started.
