const { spawn } = require('child_process');
const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');
const mammoth = require('mammoth');

async function extractTextFromFile(filePath) {
    if (filePath.endsWith('.pdf')) {
        const data = fs.readFileSync(filePath);
        const parsed = await pdf(data);
        return parsed.text;
    } else if (filePath.endsWith('.txt')) {
        return fs.readFileSync(filePath, 'utf-8');
    }
    return '';
}

async function runPlagiarismCheck(targetText, otherTexts) {
    if (!targetText.trim()) {
        throw new Error("Target submission has no extractable text.");
    }

    return new Promise((resolve, reject) => {
        const python = spawn('python', [path.join(__dirname, '../plagiarism_check.py')]);
        const input = JSON.stringify({ submission: targetText, others: otherTexts });

        let output = '';
        python.stdout.on('data', (data) => output += data.toString());
        python.stderr.on('data', (err) => console.error('Python stderr:', err.toString()));
        python.on('close', (code) => {
            if (code !== 0) return reject('Python script failed');
            resolve(JSON.parse(output));
        });

        python.stdin.write(input);
        python.stdin.end();
    });
}

module.exports = { extractTextFromFile, runPlagiarismCheck };
