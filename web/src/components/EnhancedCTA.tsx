import { motion } from 'framer-motion';

export default function EnhancedCTA() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-surface p-8 rounded-3xl text-center"
    >
      <h3 className="text-3xl font-bold mb-4">Ready to Experience Noori?</h3>
      <p className="text-xl mb-6">Join thousands of Afghans moving smarter.</p>
      <button className="bg-green-600 hover:bg-green-700 px-10 py-4 rounded-full text-lg font-semibold transition-all">
        Download App Now
      </button>
    </motion.div>
  );
}