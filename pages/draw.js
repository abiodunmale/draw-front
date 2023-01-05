import canvas from 'canvas';
import { useState, useEffect, useRef } from "react";


export default function Draw() {

    const imageSize = {
        width: 512,
        height: 512,
    };

    const blankCanvas = canvas.createCanvas(imageSize.width, imageSize.height);
    const ctx = blankCanvas.getContext("2d");

    const background = ['background/Crimson', 'background/Fireplace', 'background/Grayscale', 'background/Icy'];
    const body = ['body/Athens', 'body/Chalk', 'body/Dark Brown', 'body/Dark Red'];
    const body_piece = ['Body Piece/Armor of Achille', 'Body Piece/Full Golden Chestpiece', 'Body Piece/Gold Strap', 'Body Piece/Toga'];
    const bracer = ['Bracer/Black Leather', 'Bracer/Brown Leather', 'Bracer/Gold Plating Emerald Gem', 'Bracer/Silver Plating Sapphire Gem'];
    const eyes = ['Eyes/Brush', 'Eyes/Glowing Blue', 'Eyes/Glowing Yellow', 'Eyes/White'];
    const headpiece = ['Headpiece/Black Beast Helm', 'Headpiece/Black Demon Helm', 'Headpiece/Gold Roman Helm Blue', 'Headpiece/Rad Blond Hair'];


    const [step, setStep] = useState(0);
    const [doP, setDoP] = useState([background, body, body_piece, bracer, eyes, headpiece]);
    const [current, setCurrent] = useState(doP[step]);
    const [bgUrl, setBgUrl] = useState("/Placeholder.png");
    const [selectedTraits, setSelectedTraits] = useState([]);
    const [currentLayer, setCurrentLayer] = useState('BACKGROUND');

    
    const addLayer = async (traitType,val) => {
        const img = await canvas.loadImage(`/layers/${traitType}/${val}.png`);
        console.log("addLayer", traitType, val, img);
        ctx.drawImage(img,0,0,imageSize.width,imageSize.height);
        setBgUrl(blankCanvas.toDataURL("image/png"));
    };

    const generateCanvas = async () => {
        selectedTraits.sort((a, b) => a.order - b.order);
        console.log(selectedTraits);
        for (let index = 0; index < selectedTraits.length; index++) {
            await addLayer(selectedTraits[index].layer,selectedTraits[index].trait);
        }
    };

    useEffect(() => {
        generateCanvas();
    }, [selectedTraits])

    const aCardPressed = async (item) => {
        let layerName = trimLayerName(item);
        let traitName = trimFileName(item);
        console.log(layerName, traitName);

        if(selectedTraits.map(x => x.layer).includes(layerName)){
            setSelectedTraits([...selectedTraits.filter(item => item.layer !== layerName), {layer: layerName, trait: traitName, order: step}]);
        }else{
            setSelectedTraits([...selectedTraits, {layer: layerName, trait: traitName, order: step}]);
        }

        // await new Promise(r => setTimeout(r, 2000));
    };

    const nextStage = async (newStep) => {
        console.log(newStep, doP.length);
        if(newStep < doP.length){
            let layerName = trimLayerName(doP[newStep][0]).toUpperCase();
            setCurrentLayer(layerName);
            setCurrent(doP[newStep]);
            setStep(newStep);
        }
    };

    const prevStage = (newStep) => {
        console.log(newStep, doP.length);
        let layerName = trimLayerName(doP[newStep][0]).toUpperCase();
        setCurrentLayer(layerName);
        setCurrent(doP[newStep]);
        setStep(newStep);
    };

    const finishStage = () => {
        alert("coming soon");
    }

    const trimLayerName = (name) => {
        return name.substring(0, name.indexOf("/"))
    }

    const trimFileName = (name) => {
        return name.split("/").pop().replace(/\.[^/.]+$/, "");
    };

    return (
        <div className='flex flex-col w-full h-screen'>
            <div className="flex flex-row mt-10">
                <div className="flex-1 w-32">
                    <div className='max-w-screen-lg mx-auto pb-10 flex justify-center'>
                        <img className='rounded mt-5' width={512} height={512} src={bgUrl} />
                    </div>
                </div>
                <div className="flex-1 w-64 mt-20 p-10 rounded-md items-center justify-center">
                    
                    <h5 className='text-xl leading-6 font-medium text-gray-100 ml-5'>{currentLayer}</h5>
                    <div className="mt-2 p-5 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-5">
                        {current.map((item, i) => {
                            return (
                                <div 
                                    key={i} 
                                    onClick={() => aCardPressed(item)} 
                                    className={`${(selectedTraits.some(data => data.trait == trimFileName(item))) ? 'ring-2 ring-indigo-500' : ''} p-4 rounded-xl border border-gray-700 cursor-pointer`}>
                                    <span className='text-white'>{trimFileName(item)}</span>
                                </div>
                            )
                        })}
                    </div>
                    {(selectedTraits.length > 0 && step > 0) &&
                        <button onClick={ () => prevStage((step - 1))} className="border-2 border-gray-700 text-white font-semibold p-2 px-4 rounded-md mb-2 ml-5">Prev</button> 
                    }

                    {(selectedTraits.length > step) &&
                        <button onClick={ () => nextStage((step + 1))} className="float-right border-2 border-gray-700 text-white font-semibold p-2 px-4 rounded-md mb-5 mr-5">Next</button> 
                    }

                </div>
                {/* <div className="basis-1/4">2</div> */}
            </div>
        </div>
    )
}