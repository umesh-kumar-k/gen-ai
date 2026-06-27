#!/usr/bin/env node
import { handleIngestion } from './ingest';
import { logger } from './util/logger';

logger.info('Starting the main program...');

handleIngestion().catch((error) => {
  logger.error(error);
  process.exit(1);
});
  
