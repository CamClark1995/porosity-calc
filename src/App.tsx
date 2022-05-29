import React from 'react';
import './App.css';

// const ColorAnalyzer = require('rgbaster');

const App = () => {

  const [imageUri, setImageUri] = React.useState<string>("");
  const [porosity, setPorosity] = React.useState<number>(-1);

  const updateImage = (files: FileList | null): void => {
    if (imageUri) {
      // Clear canvas/porosity
      const canvas: HTMLCanvasElement = document.getElementById('img-canvas') as HTMLCanvasElement;
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      setPorosity(-1);
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

  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        resolve(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    })
  };

  // const getDominantColors = async () => {
  //   const result = await ColorAnalyzer(imageUri);
  //   console.log(result);
  // };

  const convertToBlackAndWhite = (rgbThreshold: number) => {
    const img: HTMLElement | null = document.getElementById('img');
    const canvas: HTMLCanvasElement = document.getElementById('img-canvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');

    // Set canvas width/height to image width/height
    canvas.width = img?.clientWidth ?? 0;
    canvas.height = img?.clientHeight ?? 0;

    // Clear canvas
    ctx?.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the uploaded image to the canvas
    let canvasImg = img as CanvasImageSource;
    ctx?.drawImage(canvasImg, 0, 0, canvas.width, canvas.height);

    // Get ImageData obj from canvas
    let imgData: ImageData | undefined = ctx?.getImageData(0, 0, canvas.width, canvas.height);

    if (imgData) {
      let blackCount: number = 0;
      let whiteCount: number = 0;

      // Loop through the pixel data (rgb values) of the image
      for (let i = 0; i < imgData?.data.length; i += 4) {

        // Total up the rgb values of the pixel
        let count = imgData.data[i] + imgData.data[i + 1] + imgData.data[i + 2];

        let color: number = 0;

        // If rgb total is less than 382 (half the max), set color to 0 (black)
        if (count < rgbThreshold) {
          color = 0;
          blackCount++;
        }
        // If rgb total is greater than 382, set color to 255 (white)
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
      ctx?.putImageData(imgData, 0, 0);

      downsizeImg(img, canvas, ctx);

      // Determine the percentage of black pixels - this will be the porosity
      let porosity = ((blackCount / (whiteCount + blackCount)) * 100);

      // Round to two decimal places
      setPorosity(parseFloat(porosity.toFixed(2)));
    }
  };

  const downsizeImg = (img: HTMLElement | null, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D | null): void => {
    let canvas2: HTMLCanvasElement = document.createElement('canvas');
    let context2 = canvas2.getContext("2d");

    canvas2.width = canvas.width;
    canvas2.height = canvas.height;
    context2?.drawImage(canvas, 0, 0);

    var curWidth = img?.clientWidth ?? 0;
    var curHeight = img?.clientHeight ?? 0;

    while (curWidth > 400 || curHeight > 600) {
      curWidth = curWidth * .9;
      curHeight = curHeight * .9;
      ctx?.drawImage(canvas2, 0, 0, curWidth, curHeight);
    }

    canvas.width = curWidth;
    canvas.height = curHeight;
    ctx?.drawImage(canvas2, 0, 0, curWidth, curHeight);
  };

  return (
    <div className="App">
      <h2>Select Image to Calculate Porosity</h2>
      <div id="top-row">
        <form>
          <input
            type="file"
            accept="image/*"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateImage(e.target.files)}
          />
        </form>
        {imageUri && porosity < 0 && <button onClick={() => convertToBlackAndWhite(Math.floor(755 * .5))}>Calculate Porosity</button>}
        {porosity > 0 && <span id="porosity-span">Porosity: {porosity}%</span>}
      </div>

      {imageUri && <img id="img-sm" src={imageUri} alt="img cannot be displayed"></img>}
      {porosity > 0 &&
        <div id="threshold-select">
          <button onClick={() => convertToBlackAndWhite(Math.floor(755 * .25))}>Threshold 1</button>
          <button onClick={() => convertToBlackAndWhite(Math.floor(755 * .33))}>Threshold 2</button>
          <button onClick={() => convertToBlackAndWhite(Math.floor(755 * .5))}>Threshold 3 (default)</button>
          <button onClick={() => convertToBlackAndWhite(Math.floor(755 * .66))}>Threshold 4</button>
          <button onClick={() => convertToBlackAndWhite(Math.floor(755 * .75))}>Threshold 5</button>
        </div>
      }
      <div className={porosity < 0 ? "hide" : ""}><canvas id="img-canvas" className={porosity > 0 ? "canvas" : ""}></canvas></div>
      {imageUri && <img id="img" className="hidden" src={imageUri} alt='img cannot be displayed'></img>}

    </div>
  );
}

export default App;
