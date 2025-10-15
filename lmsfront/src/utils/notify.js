import toast from 'react-hot-toast';

export const notifySuccess = (msg) => toast.success(msg, { position: 'top-center', duration: 2000 });
export const notifyError = (msg) => toast.error(msg, { position: 'top-center', duration: 2500 });
