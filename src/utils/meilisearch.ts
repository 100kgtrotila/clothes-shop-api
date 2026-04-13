import { Meilisearch } from "meilisearch";
import { logger } from "./logger.js";

export const meiliClient = new Meilisearch({
	host: process.env.MEILI_HOST || "http://localhost:7700",
	apiKey: process.env.MEILI_MASTER_KEY || "supersecret",
});

export const setupMeilisearch = async () => {
	try {
		const index = meiliClient.index("products");
		await index.updateSearchableAttributes(["name", "description"]);
		await index.updateFilterableAttributes(["price", "categoryId"]);

		logger.info("Meilisearch is configured");
	} catch (err) {
		logger.error({ err }, "Failed to connect to Meilisearch");
	}
};
