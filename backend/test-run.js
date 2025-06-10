const { runPlagiarismCheck } = require('./utils/plagiarism');

(async () => {
    try {
        const result = await runPlagiarismCheck(
            "This is the original text",
            [
                "Copied from original",
                "Completely different sentence",
                "Very similar to the original text"
            ]
        );
        console.log(result);
    } catch (err) {
        console.error('❌ Error running plagiarism check:', err);
    }
})();
