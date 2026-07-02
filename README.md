# Salient

Salient is a [Tailwind UI](https://tailwindui.com) site template built using [Tailwind CSS](https://tailwindcss.com) and [Next.js](https://nextjs.org).

## Getting started

To get started with this template, first install the npm dependencies:

```bash
npm install
```

Create a `.env.local` file (or copy from `.env.example`) with:

```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3009
# Optional: only needed when a visitor clicks "View map" on a property or contact page.
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_browser_api_key
```

Homepage reviews and ratings come from the backend cache (`GET /api/v1/public/google-reviews`), refreshed daily by the backend cron — zenvana does not call Google Places directly.

Next, run the development server:

```bash
npm run dev
```

Finally, open [http://localhost:3000](http://localhost:3000) in your browser to view the website.

## Browser support

The marketing site targets **evergreen desktop browsers**, **iOS Safari 15+**, and **current Android Chrome / WebView**. Internet Explorer and legacy WebView are **not** supported. The exact query lives in `package.json` under `browserslist` and is documented in `docs/superpowers/specs/2026-05-14-zenvana-home-lighthouse-design.md`.

## Customizing

You can start editing this template by modifying the files in the `/src` folder. The site will auto-update as you edit these files.

## License

This site template is a commercial product and is licensed under the [Tailwind UI license](https://tailwindui.com/license).

## Learn more

To learn more about the technologies used in this site template, see the following resources:

- [Tailwind CSS](https://tailwindcss.com/docs) - the official Tailwind CSS documentation
- [Next.js](https://nextjs.org/docs) - the official Next.js documentation
- [Headless UI](https://headlessui.dev) - the official Headless UI documentation
