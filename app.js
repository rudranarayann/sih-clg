let model;

// Load the COCO-SSD model
const loadModel = async () => {
    model = await cocoSsd.load();
    console.log("Model loaded");
};
loadModel();

// Handle file upload and prediction
document.getElementById('image-upload').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = async () => {
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');

        // Resize image to fit canvas
        const maxWidth = 800;
        const maxHeight = 800;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
        }

        if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);

        const predictions = await model.detect(img);
        console.log(predictions);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, width, height);

        let detectedObjects = [];
        let acceptance = "Rejected";
        let unacceptableObjects = [];

        predictions.forEach(prediction => {
            const [x, y, width, height] = prediction.bbox;
            ctx.beginPath();
            ctx.rect(x, y, width, height);
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#00ff00';  // Use green for bounding box
            ctx.fillStyle = '#00ff00';    // Use green for text
            ctx.stroke();
            ctx.fillText(prediction.class + ' (' + Math.round(prediction.score * 100) + '%)', x, y > 10 ? y - 5 : 10);

            // Map detected classes to scrap categories
            const scrapType = scrapCategoryMapping[prediction.class];
            if (scrapType) {
                detectedObjects.push({
                    type: scrapType,
                    score: prediction.score
                });
                if (scrapType !== "Non-Scrap" && prediction.score > 0.5) {
                    acceptance = "Accepted";
                }
            } else {
                unacceptableObjects.push(prediction.class);
            }
        });

        if (detectedObjects.length > 0) {
            const objectTypes = detectedObjects.map(obj => obj.type).join(', ');
            document.getElementById('result').innerText = `Detected Objects: ${objectTypes} - ${acceptance}`;
        } else {
            document.getElementById('result').innerText = `No recognized scrap types detected - ${acceptance}`;
        }

        if (unacceptableObjects.length > 0) {
            const uniqueUnacceptable = [...new Set(unacceptableObjects)];
            document.getElementById('suggestions').innerText = `Unacceptable items detected: ${uniqueUnacceptable.join(', ')}. Please remove these items for acceptance.`;
        } else {
            document.getElementById('suggestions').innerText = "";
        }
    };
});

// Handle acceptance and rejection
document.getElementById('accept-button').addEventListener('click', () => {
    const category = document.getElementById('categories').value;
    console.log("Accepted:", category);
    // Handle the acceptance logic (e.g., save to server or local storage)
});

document.getElementById('reject-button').addEventListener('click', () => {
    const category = document.getElementById('categories').value;
    console.log("Rejected:", category);
    // Handle the rejection logic (e.g., save to server or local storage)
});

// Handle feedback submission
document.getElementById('submit-feedback').addEventListener('click', () => {
    const feedback = document.getElementById('feedback').value;
    if (feedback.trim() === "") {
        alert("Please provide feedback before submitting.");
        return;
    }
    console.log("Feedback submitted:", feedback);
    // Optionally, send feedback to a server
    // Example using Fetch API:
    fetch('/submit-feedback', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feedback }),
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        document.getElementById('feedback').value = ''; // Clear the textarea
    })
    .catch((error) => {
        console.error('Error:', error);
    });
});
