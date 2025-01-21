'use client'
import Image from "next/image";
import AccessCardContainer from "@/app/_ui/components/accessCardContainer";
import {Box} from '@chakra-ui/react'

export default function AccessHero() {
    return (
        <>
            <div className="hidden  relative lg:flex h-full w-1/2 items-center self-center justify-center bg-gradient-to-tr from-gray-200 to-gray-300">
                    <div className="w-full h-full flex absolute bottom-0 bg-white/10 backdrop-blur-lg"></div>
                    <div className="absolute">
                        <Box textAlign='center' alignContent='center' alignItems='center' alignSelf='center' className='bg-white px-10 py-20  rounded-3xl'>

                            <h1 className=' text-5xl font-bold'>¡Bienvenidos!</h1>
                            <Image alt="" className='mt-4' width='400' height='400' src="/undraw1.png"></Image>
                            <p className='font-medium text-lg text-gray-500'>Facilita tu facturación con nuestro software:</p>
                            <p className='font-medium text-lg text-gray-500'>precisión y eficiencia en cada paso.</p>
                        </Box>
                    </div>
                </div>
        </>
    )
}
