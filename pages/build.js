import { useState, useEffect, useRef } from "react";
import toast, { Toaster } from 'react-hot-toast';
import canvas from 'canvas';
import axios from 'axios';
import { useRouter } from 'next/navigation';


import {
    getCurrentWalletConnected,
    getUserTokens,
    getBalanceToken,
    confirmReveal
} from '../utils/interact';

export default function BuildPage() {
    const router = useRouter();

    const imageSize = {
        width: 512,
        height: 512,
    };

    const blankCanvas = canvas.createCanvas(imageSize.width, imageSize.height);
    const ctx = blankCanvas.getContext("2d");

    const background = ['Background/Crimson', 'Background/Fireplace', 'Background/Grayscale', 'Background/Icy'];
    const body = ['Body/Athens', 'Body/Chalk', 'Body/Dark Brown', 'Body/Dark Red'];
    const body_piece = ['Body Piece/Armor of Achille', 'Body Piece/Full Golden Chestpiece', 'Body Piece/Gold Strap', 'Body Piece/Toga'];
    const bracer = ['Bracer/Black Leather', 'Bracer/Brown Leather', 'Bracer/Gold Plating Emerald Gem', 'Bracer/Silver Plating Sapphire Gem'];
    const eyes = ['Eyes/Brush', 'Eyes/Glowing Blue', 'Eyes/Glowing Yellow', 'Eyes/White'];
    const headpiece = ['Headpiece/Black Beast Helm', 'Headpiece/Black Demon Helm', 'Headpiece/Gold Roman Helm Blue', 'Headpiece/Rad Blond Hair'];
    const arm_Ring = ['Arm Ring/Bronze Loop Blue Beads', 'Arm Ring/Bronze Loop White Beads', 'Arm Ring/Gold Band', 'Arm Ring/Silver Loop Red Beads'];
    const necklace = ['Necklace/Blue Gempiece', 'Necklace/Large Green Beads', 'Necklace/Red Neckmask', 'Necklace/Tooth Necklace'];
    const rune = ['Rune/Energy', 'Rune/Health', 'Rune/Protection', 'Rune/Luck'];
    const tattoos = ['Tattoos/Ancient Markings', 'Tattoos/Sacred Markings', 'Tattoos/Snake', 'Tattoos/Nature'];
    

    const [step, setStep] = useState(0);
    const [doP, setDoP] = useState([background, body, body_piece, bracer, eyes, headpiece, arm_Ring, necklace, rune, tattoos]);
    const [current, setCurrent] = useState(doP[step]);
    const [bgUrl, setBgUrl] = useState("/Placeholder.png");
    const [selectedTraits, setSelectedTraits] = useState([]);
    const [currentLayer, setCurrentLayer] = useState('BACKGROUND');
    const [tokenId, setTokenId] = useState(4);
    const [final, setFinal] = useState(false);
    const [walletAddress, setWalletAddress] = useState("");
    const [userToken, setUserToken] = useState([]);
    const [loadingPage, setLoadingPage] = useState({home: true, nft: true});
    const [disabledBtn, setDisabledBtn] = useState(false);
    
    const addLayer = async (traitType,val) => {
        const img = await canvas.loadImage(`/layers/${traitType}/${val}.png`);
        // console.log("addLayer", traitType, val, img);
        ctx.drawImage(img,0,0,imageSize.width,imageSize.height);
        setBgUrl(blankCanvas.toDataURL("image/png"));
    };

    const generateCanvas = async () => {
        selectedTraits.sort((a, b) => a.order - b.order);
        for (let index = 0; index < selectedTraits.length; index++) {
            await addLayer(selectedTraits[index].layer,selectedTraits[index].trait);
        }
    };

    useEffect(() => {
        generateCanvas();
    }, [selectedTraits])


    const getData = async () => {
        const { success, status, address } = await getCurrentWalletConnected();
        if(!success){
            router.push('/');
            return;
        }
        setWalletAddress(address);
    };

    useEffect(() => {
        getData();   
    },[])

    const getUserData = async () => {
        if(walletAddress.length > 0){
            const bal = Number(await getBalanceToken(walletAddress));
            if(bal === 0) {
                router.push('/');
                toast.error("You do not have any token to build!!");
            }
            setUserToken(await getUserTokens(walletAddress));
            setLoadingPage({...loadingPage, home: false});
        }
    };

    useEffect(() => {
        getUserData();   
    },[walletAddress])

    const aCardPressed = async (item) => {
        let layerName = trimLayerName(item);
        let traitName = trimFileName(item);
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

        if(newStep === doP.length){
            console.log("~~~ done selecting ~~~");
            setFinal(true);
        }
    };

    const prevStage = (newStep) => {
        // console.log(newStep, doP.length);
        let layerName = trimLayerName(doP[newStep][0]).toUpperCase();
        setCurrentLayer(layerName);
        setCurrent(doP[newStep]);
        setStep(newStep);
    };

    const finishStage = async () => {
        // alert("coming soon");

        // console.log(selectedTraits);
        setDisabledBtn(true);

        const data = {
            nftID : tokenId,
            Arm_Ring: selectedTraits.find(x => x.layer === 'Arm Ring').trait,
            Background: selectedTraits.find(x => x.layer === 'Background').trait,
            Body: selectedTraits.find(x => x.layer === 'Body').trait,
            Body_Piece: selectedTraits.find(x => x.layer === 'Body Piece').trait,
            Bracer: selectedTraits.find(x => x.layer === 'Bracer').trait,
            Eyes: selectedTraits.find(x => x.layer === 'Eyes').trait,
            Headpiece: selectedTraits.find(x => x.layer === 'Headpiece').trait,
            Necklace: selectedTraits.find(x => x.layer === 'Necklace').trait,
            Rune: selectedTraits.find(x => x.layer === 'Rune').trait,
            Tattoos: selectedTraits.find(x => x.layer === 'Tattoos').trait
        };

        let { success, status } = await confirmReveal(walletAddress);
        if(success){
            const toastOne = toast.loading(`Processing your nft...`);
            await axios.post("https://api-nft.onrender.com/nft/generate", data)
            .then(function (result) {
                toast.dismiss(toastOne);
                toast.success(`Nft ${tokenId} succesfully revealed!!!`);
                cancelReveal();  
                setLoadingPage({...loadingPage, nft: true})
            })
            .catch(function (error) {
                toast.dismiss(toastOne);
                toast.error("An error occured, cannot reveal nft");
            });
        }

        setDisabledBtn(false);
    };

    const cancelReveal = async () => {
        setSelectedTraits([]);
        setStep(0);
        setCurrentLayer('BACKGROUND');
        setCurrent(doP[0]);
        setBgUrl("/Placeholder.png");
        setFinal(false);
        setLoadingPage({...loadingPage, nft: true})
    };

    const trimLayerName = (name) => {
        return name.substring(0, name.indexOf("/"))
    }

    const trimFileName = (name) => {
        return name.split("/").pop().replace(/\.[^/.]+$/, "");
    };

    const aTokenPressed = async (tokenId) => {
        let metadata = await axios.get(`https://api-nft.onrender.com/nft/metadata/${tokenId}`).catch(function (error) {
            if(error.response.status == 404){
                setTokenId(tokenId);
                setLoadingPage({...loadingPage, nft: false})
            }
        });

        if(metadata){
            toast.error("Token already revealed");
            return;
        }
    };

    return (
        <div className='flex flex-col w-full h-screen'>
            <Toaster
                position="top-center"
                reverseOrder={false}
            />
            {loadingPage.nft ? 
                <>
                    {loadingPage.home ? 
                        <div className="text-center mt-40">
                            <div role="status">
                                <svg className="inline mr-2 w-10 h-10 text-white-200 animate-spin dark:text-white-600 fill-gray-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                                    <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                                </svg>
                                <span className="sr-only">Loading...</span>
                            </div>
                        </div>
                    :  
                        <div className="mt-5 p-10 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-5 gap-5">
                            {userToken.map((item, i) => {
                            return(
                                <div 
                                    key={i} 
                                    onClick={() => aTokenPressed(item.tokenId)} 
                                    className={`cursor-pointer p-4 rounded-xl border-2 border-gray-700 overflow-hidden shadow-2xl`}>
                                
                                    <img className="rounded-xl" width={512} height={512} src={item.img ? item.img : '/Placeholder.png'} alt="pfp"></img>
                                    <div className="mt-5 text-center">
                                        <span className="text-gray-100 font-thin">{item.name}</span>
                                    </div>
                                </div>
                            )
                            })} 
                        </div>
                    }
                </> 
            :
                <div className="flex flex-row mt-10">
                    <div className="flex-1 w-32">
                        <div className='max-w-screen-lg mx-auto pb-10 flex justify-center'>
                            <img className='rounded mt-5' width={512} height={512} src={bgUrl} />
                        </div>
                    </div>
                    <div className="flex-1 w-64 mt-20 p-10 rounded-md items-center justify-center">

                        {!final ? 
                            <>
                                <button 
                                    onClick={ () => cancelReveal()} 
                                    className="float-right border border-gray-700 text-white font-semibold p-2 px-4 rounded-md">
                                    Back
                                </button>
                                <br/>
                                <h5 className='text-xl leading-6 font-medium text-gray-100 ml-5 mt-10'>Token {tokenId}</h5>
                                <h5 className='text-xl leading-6 font-medium text-gray-100 ml-5 mt-5'>{currentLayer} ({step + 1}/{doP.length})</h5>
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
                                    <button 
                                        onClick={ () => nextStage((step + 1))} 
                                        className="float-right border-2 border-gray-700 text-white font-semibold p-2 px-4 rounded-md mb-5 mr-5">
                                        Next
                                    </button> 
                                }

                                
                            </> 
                        :   
                            <>
                                <div className='justify-center text-center'>
                                    <p className="text-3xl font-bold text-gray-100">Token {tokenId}</p>
                                    <p className="text-3xl font-bold text-gray-100">Changes cannot be undone.</p>
                                    <p className="text-3xl font-bold text-gray-100">Sign message to confirm reveal of your NFT.</p>
                                    <button 
                                        onClick={ () => finishStage()}
                                        disabled={disabledBtn}
                                        className="border-2 border-gray-700 text-white font-semibold p-2 px-4 rounded-md mt-20 w-[200px]">
                                        Finish
                                    </button>
                                    <br/>
                                    <button 
                                        onClick={ () => cancelReveal()} 
                                        disabled={disabledBtn}
                                        className="border-2 border-gray-700 text-white font-semibold p-2 px-4 rounded-md mt-5 w-[200px]">
                                        Cancel
                                    </button>
                                </div>
                            </>
                        }
                    </div>
                    {/* <div className="basis-1/4">2</div> */}
                </div>
            }
        </div>
    )
}