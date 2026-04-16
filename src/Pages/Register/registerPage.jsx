export default function RegisterPage(){
    return (
        <div className="w-full h-screen bg-primary flex">
            <div className="w-[calc(100%-560px)] h-full bg-primary flex justify-center items-center">
                <div className="w-full h-full py-[48px] px-[100px] font-[Inter] text-left justify-center flex flex-col">
                    
                    <div className="text-secondary text-[24px] font-bold font-[Inter] text-left flex items-center">
                        <img src="/public/Logo.png" className="w-[50px] h-[35px] mr-1 object-fill" />
                        VetCloud
                    </div>

                    <div className="text-secondary font-[Inter] text-left items-center mt-[30px]">
                        <h1 className="text-[30px] font-bold mb-[5px]">Create an Account</h1>
                        <p className="text-[#62748E] text-[16px]">Join VetCloud to access professional veterinary care.</p>
                    </div>

                    <div className="text-secondary mt-[34px]">
                        <p className="text-[#1D293D] font-bold mb-[12px]">I am registering as a:</p>

                    </div>



                </div>


            </div>

            <div className="w-[560px] h-full relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/registerDog.jpg')] bg-center bg-cover bg-no-repeat opacity-70"></div>

                {/* Gradient overlay (stronger) */}
                <div className="absolute inset-0 bg-gradient-to-br from-[rgba(0,166,62,0.85)] to-[rgba(28,57,142,0.95)]"></div> 
            </div>

        </div>
    )
}