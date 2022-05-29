import React from 'react';
import './App.css';

const App = () => {

  const [img, setImg] = React.useState<HTMLElement | null>(null);
  const [canvas, setCanvas] = React.useState<HTMLCanvasElement | null>(null);
  const [canvasContext, setCanvasContext] = React.useState<CanvasRenderingContext2D | null>(null);
  const [imageUri, setImageUri] = React.useState<string>("");
  const [porosity, setPorosity] = React.useState<number | null>(null);

  React.useEffect(() => {
    // Initialize image/canvas variables to their respective DOM elements
    let imageElement = document.getElementById('img');
    let canvasElement = document.getElementById('img-canvas') as HTMLCanvasElement;
    let ctx = canvasElement.getContext("2d");

    if (imageElement)
      setImg(imageElement);
    if (canvasElement)
      setCanvas(canvasElement);
    if (ctx)
      setCanvasContext(ctx);
  }, []);

  const handleImageChange = (files: FileList | null): void => {
    if (!img || !canvas || !canvasContext) {
      console.error("Element variable failed to load");
      return;
    }

    // Clear canvas/porosity if there is a current image
    if (imageUri) {
      canvasContext.clearRect(0, 0, canvas.width, canvas.height);
      setPorosity(null);
    }

    if (files === null || files[0] === null) {
      console.error("No file found, returning");
      return;
    }
    else if (files.length > 1)
      console.log("Multiple files found, using first");

    fileToDataUri(files[0])
      .then(dataUri => setImageUri(dataUri));
  };

  // Convert file to URI
  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        resolve(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    })
  };

  const calculatePorosity = (rgbThreshold: number) => {
    if (!img || !canvas || !canvasContext) {
      console.error("Element variable failed to load");
      return;
    }

    // Set canvas width/height to image width/height
    canvas.width = img.clientWidth;
    canvas.height = img.clientHeight;

    // Clear canvas
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the uploaded image to the canvas
    let canvasImg = img as CanvasImageSource;
    canvasContext.drawImage(canvasImg, 0, 0, canvas.width, canvas.height);

    // Get ImageData obj from canvas
    let imgData: ImageData | undefined = canvasContext.getImageData(0, 0, canvas.width, canvas.height);

    if (!imgData) {
      console.error("Failed to pull image data from context");
      return;
    }

    // Convert image to black/white
    let blackCount: number = 0;
    let whiteCount: number = 0;

    // Loop through the pixel data (rgb values) of the image
    for (let i = 0; i < imgData?.data.length; i += 4) {
      let color: number;
      // Total up the rgb values of the pixel
      let count = imgData.data[i] + imgData.data[i + 1] + imgData.data[i + 2];

      // If rgb total is less than threshold, set color to 0 (black)
      if (count < rgbThreshold) {
        color = 0;
        blackCount++;
      }
      // If rgb total is greater than threshold, set color to 255 (white)
      else {
        color = 255;
        whiteCount++;
      }

      // Update the color of the pixel to either black/white
      imgData.data[i] = color;
      imgData.data[i + 1] = color;
      imgData.data[i + 2] = color;
      imgData.data[i + 3] = 255;
    }

    // Draw the black and white image back to the canvas
    canvasContext?.putImageData(imgData, 0, 0);

    // Downsize the canvas image to fit screen
    downsizeImg(img, canvas, canvasContext);

    // Determine the percentage of black pixels - this will be the porosity
    let porosity = ((blackCount / (whiteCount + blackCount)) * 100);

    // Round to two decimal places
    setPorosity(parseFloat(porosity.toFixed(2)));
  };

  // Downsize canvas from size of original image to make it fit screen
  const downsizeImg = (img: HTMLElement, canvas: HTMLCanvasElement, canvasContext: CanvasRenderingContext2D): void => {
    // Create a duplicate canvas to hold canvas data
    let dupCanvas: HTMLCanvasElement = duplicateCanvas(canvas);

    // Set the current height/width of the uploaded image
    var curWidth = img.clientWidth;
    var curHeight = img.clientHeight;

    // While height/width are greater than their thresholds (hardcoded), downsize canvas size by 9/10
    while (curWidth > 400 || curHeight > 600) {
      curWidth = curWidth * .9;
      curHeight = curHeight * .9;
      canvasContext.drawImage(dupCanvas, 0, 0, curWidth, curHeight);
    }

    // Setting the canvas width/height resets the entire canvas so we have to re-draw with duplicate
    canvas.width = curWidth;
    canvas.height = curHeight;
    canvasContext.drawImage(dupCanvas, 0, 0, curWidth, curHeight);
  };

  const duplicateCanvas = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
    let dupCanvas: HTMLCanvasElement = document.createElement('canvas');
    let dupContext = dupCanvas.getContext("2d");

    dupCanvas.width = canvas.width;
    dupCanvas.height = canvas.height;
    dupContext?.drawImage(canvas, 0, 0);

    return dupCanvas;
  };

  return (
    <div className="App">
      <h2>Select Image to Calculate Porosity</h2>

      <div id="top-row">
        <form>
          <input
            type="file"
            accept="image/*"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleImageChange(e.target.files)}
          />
        </form>
        {imageUri && !porosity &&
          <button
            onClick={() => calculatePorosity(Math.floor(755 * .5))}
          >
            Calculate Porosity
          </button>
        }
        {porosity &&
          <span id="porosity-span">Porosity: {porosity}%</span>
        }
      </div>

      {imageUri &&
        <img id="img-sm" src={imageUri} alt="img cannot be displayed"></img>
      }

      {porosity &&
        <div id="threshold-select">
          <button onClick={() => calculatePorosity(Math.floor(755 * .25))}>Threshold 1</button>
          <button onClick={() => calculatePorosity(Math.floor(755 * .33))}>Threshold 2</button>
          <button onClick={() => calculatePorosity(Math.floor(755 * .5))}>Threshold 3 (default)</button>
          <button onClick={() => calculatePorosity(Math.floor(755 * .66))}>Threshold 4</button>
          <button onClick={() => calculatePorosity(Math.floor(755 * .75))}>Threshold 5</button>
        </div>
      }

      <div className={!porosity ? "hide" : ""}>
        <canvas id="img-canvas" className={porosity ? "displayBorder" : ""}></canvas>
      </div>

      <img id="img" className="hidden" src={imageUri} alt='img cannot be displayed'></img>

    </div>
  );
}

export default App;
