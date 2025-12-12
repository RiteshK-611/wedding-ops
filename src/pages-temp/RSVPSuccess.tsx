import { Heart, CheckCircle } from 'lucide-react';

export default function RSVPSuccess() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                </div>

                <h1 className="text-3xl font-bold text-slate-900 mb-3">
                    Thank You!
                </h1>

                <p className="text-lg text-slate-600 mb-6">
                    Your RSVP has been received. We can't wait to celebrate with you!
                </p>

                <div className="p-4 bg-primary-50 rounded-lg mb-6">
                    <div className="flex items-center justify-center text-primary-700">
                        <Heart className="w-5 h-5 mr-2" />
                        <span className="font-medium">Your response has been saved</span>
                    </div>
                </div>

                <p className="text-sm text-slate-500">
                    You'll receive event details and logistics information closer to the date.
                    If you need to update your response, simply use the same RSVP link.
                </p>
            </div>
        </div>
    );
}
