export const getProfileProps = (numero: string) => {
  // Generate a consistent color based on the phone number
  const hash = numero.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const colors = [
    'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
  ];
  
  const color = colors[Math.abs(hash) % colors.length];
  const initials = numero.slice(-2).toUpperCase();
  
  return {
    color,
    initials,
    numero
  };
};