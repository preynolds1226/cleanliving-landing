# Privacy Policy (Draft)

This is a draft privacy policy for the CleanLiving prototype. It is not legal advice.

## What we collect

- **Camera image (label scan)**: When you scan a product label, the app captures an image so it can extract ingredients and generate a result.
- **Scan results and history (local)**: The app stores scan results on your device to build your “My Home” audit log and calculate a House score.

## How we use data

- **To analyze labels**: The scan image is used to generate the ingredient list, risk highlights, hormone notes, purity score, and suggested swaps.
- **To show your progress**: Your on-device history is used to display your past scans and aggregate House score.

## Where data is stored

- **On-device**: Scan history is stored locally using SQLite.
- **Backend / model provider**: If you configure the app to use the secure HTTPS proxy, the scan image is sent to your backend which then calls the model provider and returns a JSON result.

## Sharing

- We do not sell your personal information.
- Your scan image may be processed by the model provider when analysis is performed.

## Affiliate links

The app may show affiliate links to products. If you purchase through these links, CleanLiving may earn a commission at no extra cost to you.

## Public URL (App Store)

The policy shown to users should match the URL in `app.json` → `extra.privacyPolicyUrl`:

https://preynolds1226.github.io/cleanliving-landing/privacy.html

Enable **GitHub Pages** on the `cleanliving-landing` repo (branch `main`, root) so this URL resolves.

## Contact

Use the same support email as the live `privacy.html` (replace `support@yourdomain.com` before release).

