/**
 * @fileOverview This file contains utility functions for parsing and processing uploaded financial files.
 * It handles reading data from various formats (CSV, XLSX) and applying business logic.
 */

import { Bucket } from '@google-cloud/storage';
import { Readable } from 'stream';
import * as xlsx from 'xlsx';
import csv from 'csv-parser';

type FileMeta = {
    name: string;
    path: string;
    uploadedAt: any;
};

type SessionFiles = {
    glEntries: FileMeta;
    budgetHolderMapping: FileMeta;
    costItemMap: FileMeta;
    regionalMapping: FileMeta;
    corrections?: FileMeta;
    revenueReport?: FileMeta;
};

// Helper to download a file from GCS and return a Buffer
async function downloadFile(bucket: Bucket, filePath: string): Promise<Buffer> {
    const file = bucket.file(filePath);
    const [buffer] = await file.download();
    return buffer;
}

// Helper to parse any file type (CSV or XLSX) from a buffer into JSON
async function parseFinancialFile(buffer: Buffer, fileName: string): Promise<any[]> {
    if (fileName.toLowerCase().endsWith('.csv')) {
        return new Promise((resolve, reject) => {
            const results: any[] = [];
            const stream = Readable.from(buffer);
            stream
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', () => resolve(results))
                .on('error', (error) => reject(error));
        });
    } else if (fileName.toLowerCase().endsWith('.xlsx') || fileName.toLowerCase().endsWith('.xls')) {
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        return xlsx.utils.sheet_to_json(worksheet);
    } else {
        throw new Error(`Unsupported file type: ${fileName}`);
    }
}

// Helper to clean and convert numeric strings
function cleanAndConvertNumeric(value: any): number {
    if (typeof value === 'number') {
        return value;
    }
    if (typeof value === 'string') {
        const cleaned = value.replace(/\s/g, '').replace(',', '.');
        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : num;
    }
    return 0;
}

/**
 * Downloads, parses, and merges all the financial data for a given session.
 * @param files The file metadata from the session document.
 * @param bucket The Firebase Admin Storage bucket instance.
 * @returns An object containing the processed data frames.
 */
export async function processUploadedFiles(files: SessionFiles, bucket: Bucket) {
    // 1. Download and parse all required files in parallel
    const [
        glEntriesData,
        budgetHolderMapData,
        costItemMapData,
        regionalMapData,
    ] = await Promise.all([
        parseFinancialFile(await downloadFile(bucket, files.glEntries.path), files.glEntries.name),
        parseFinancialFile(await downloadFile(bucket, files.budgetHolderMapping.path), files.budgetHolderMapping.name),
        parseFinancialFile(await downloadFile(bucket, files.costItemMap.path), files.costItemMap.name),
        parseFinancialFile(await downloadFile(bucket, files.regionalMapping.path), files.regionalMapping.name),
    ]);

    // 2. Process GL Entries: Clean numeric amounts and filter invalid rows
    const glEntries = glEntriesData.map(row => ({
        ...row,
        Amount_Reporting_Curr: cleanAndConvertNumeric(row.Amount_Reporting_Curr),
    })).filter(row => row.Amount_Reporting_Curr !== 0);

    // 3. Create simple mapping objects for efficient lookups
    const costItemMap = Object.fromEntries(costItemMapData.map(row => [row.cost_item, row.budget_article]));
    const budgetHolderMap = Object.fromEntries(budgetHolderMapData.map(row => [row.budget_article, row.budget_holder]));
    const regionalMap = Object.fromEntries(regionalMapData.map(row => [row.structural_unit, row.region]));

    // 4. Apply all mappings to the GL entries
    const processedDf = glEntries.map(entry => {
        const budget_article = costItemMap[entry.cost_item];
        const budget_holder = budget_article ? budgetHolderMap[budget_article] : undefined;
        const region = regionalMap[entry.structural_unit];
        return {
            ...entry,
            budget_article,
            budget_holder,
            region,
        };
    });

    // 5. Separate revenue and costs
    const revenueDf = processedDf.filter(row => row.Amount_Reporting_Curr > 0);
    const costsDf = processedDf.filter(row => row.Amount_Reporting_Curr <= 0);

    return { processedDf, revenueDf, costsDf };
}
