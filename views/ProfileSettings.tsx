
import React, { useState } from 'react';
import { useStore } from '../store';

const ProfileSettings: React.FC = () => {
  const { state, dispatch } = useStore();
  const user = state.currentUser!;
  
  const [newName, setNewName] = useState(user.name);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [msg, setMsg] = useState<{type: 'err' | 'ok', txt: string} | null>(null);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (newPin && (newPin.length !== 4 || isNaN(Number(newPin)))) {
      setMsg({type: 'err', txt: 'PIN MUST BE EXACTLY 4 DIGITS'});
      return;
    }

    if (newPin !== confirmPin) {
      setMsg({type: 'err', txt: 'PIN VERIFICATION MISMATCH'});
      return;
    }

    dispatch({ 
      type: 'UPDATE_SELF', 
      name: newName, 
      pin: newPin || user.pin 
    });

    setMsg({type: 'ok', txt: 'SECURITY CREDENTIALS UPDATED SUCCESSFULLY'});
    setNewPin('');
    setConfirmPin('');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in zoom-in-95 duration-500">
      <header className="text-center">
        <p className="text-amber-500 font-black text-[10px] tracking-widest uppercase mb-2">Security Override</p>
        <h1 className="text-3xl font-black text-emerald-900 uppercase tracking-tighter">Self-Profile Hub</h1>
        <p className="text-[10px] text-gray-400 font-bold uppercase mt-2">Modify Your Global Credentials</p>
      </header>

      <form onSubmit={handleUpdate} className="bg-white p-10 rounded-[40px] border-2 border-emerald-100 shadow-2xl space-y-8">
        <div>
          <label className="block text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-3 ml-1">Update Full Identity</label>
          <input required className="w-full px-6 py-4 rounded-2xl border-2 border-gray-100 bg-gray-50 focus:border-emerald-600 font-bold" value={newName} onChange={e => setNewName(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-6 pt-4 border-t-2 border-dashed border-gray-100">
          <div>
            <label className="block text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-3 ml-1">New Security PIN</label>
            <input type="password" placeholder="Leave empty to keep current" maxLength={4} className="w-full px-6 py-4 rounded-2xl border-2 border-gray-100 bg-gray-50 focus:border-emerald-600 font-black text-center tracking-[0.5em]" value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g,''))} />
          </div>
          <div>
            <label className="block text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-3 ml-1">Confirm New PIN</label>
            <input type="password" placeholder="Verify 4-digits" maxLength={4} className="w-full px-6 py-4 rounded-2xl border-2 border-gray-100 bg-gray-50 focus:border-emerald-600 font-black text-center tracking-[0.5em]" value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/\D/g,''))} />
          </div>
        </div>

        <button type="submit" className="w-full py-5 bg-emerald-600 text-white font-black rounded-3xl uppercase tracking-widest text-sm border-b-4 border-emerald-800 shadow-xl hover:bg-emerald-700 transition-all">Commit Security Updates</button>

        {msg && (
          <div className={`p-6 rounded-2xl border-2 text-center animate-in slide-in-from-bottom-4 duration-300 ${msg.type === 'ok' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
            <p className="text-[10px] font-black uppercase tracking-[0.15em]">{msg.txt}</p>
          </div>
        )}
      </form>

      <div className="p-8 bg-amber-50 rounded-3xl border-2 border-amber-100">
        <div className="flex gap-4">
          <span className="text-3xl">🛡️</span>
          <div>
            <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest mb-1">Administrative Protocol</p>
            <p className="text-[11px] text-amber-900 font-medium leading-relaxed italic">"As a global manager, your security integrity is vital. Regularly rotate your PIN to prevent unauthorized system overrides."</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
