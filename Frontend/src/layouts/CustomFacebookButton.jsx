import FacebookLogin from '@greatsumini/react-facebook-login';

export default function CustomFacebookButton({ onSuccess, onFail, isLoading }) {
    return (
        <FacebookLogin.default
            appId={import.meta.env.VITE_FACEBOOK_APP_ID}
            onSuccess={onSuccess}
            onFail={onFail}
            render={({ onClick }) => (
                <button
                    type="button"
                    onClick={onClick}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 px-6 py-[10px] bg-[#1877F2] border-2 border-[#1877F2] rounded-xl hover:bg-[#166FE5] shadow-sm hover:shadow-md transition-all duration-150 ease-in-out active:scale-95 active:shadow-inner active:bg-[#145cbe] focus:outline-none focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    <span className="font-medium text-white">Continue with Facebook</span>
                </button>
            )}
        />
    );
}