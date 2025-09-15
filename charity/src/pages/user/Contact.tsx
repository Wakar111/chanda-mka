import { useState } from 'react';
import { supabase } from '../../supabaseClient';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function Contact() {
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
  });
  const [status, setStatus] = useState<{ type: string; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setStatus({ type: 'error', message: 'You must be logged in to send messages.' });
        return;
      }

      const { error } = await supabase
        .from('contact_messages')
        .insert([
          {
            user_id: session.user.id,
            subject: formData.subject,
            message: formData.message,
            status: 'pending'
          }
        ]);

      if (error) throw error;

      setStatus({ type: 'success', message: 'Message sent successfully!' });
      setFormData({ subject: '', message: '' });
    } catch (error) {
      console.error('Error sending message:', error);
      setStatus({ type: 'error', message: 'Failed to send message. Please try again.' });
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navbar />
      <div className="flex-grow p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">
              Contact Us
            </h1>

            {status && (
              <div
                className={`mb-4 p-3 rounded ${
                  status.type === 'success'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {status.message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Enter the subject of your message"
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Type your message here..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Send Message
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Other Ways to Contact
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-800">Email</h3>
                  <p className="text-gray-600">support@mka-charity.org</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Phone</h3>
                  <p className="text-gray-600">+49 (0) 123 456789</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Office Hours</h3>
                  <p className="text-gray-600">Monday - Friday: 9:00 - 17:00</p>
                  <p className="text-gray-600">Saturday - Sunday: Closed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
