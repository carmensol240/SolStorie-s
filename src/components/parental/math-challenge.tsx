import { useState, useEffect } from 'react';
import { Lock, RefreshCw, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface MathChallengeProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

const UNLOCK_DURATION = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 3;
const TIMEOUT_DURATION = 30 * 1000; // 30 seconds

const generateProblem = () => {
  const operations = ['+', '-', '×'];
  const operation = operations[Math.floor(Math.random() * operations.length)];
  
  let a: number, b: number, answer: number;
  
  switch (operation) {
    case '+':
      a = Math.floor(Math.random() * 20) + 5;
      b = Math.floor(Math.random() * 20) + 5;
      answer = a + b;
      break;
    case '-':
      a = Math.floor(Math.random() * 20) + 15;
      b = Math.floor(Math.random() * 15) + 1;
      answer = a - b;
      break;
    case '×':
      a = Math.floor(Math.random() * 8) + 2;
      b = Math.floor(Math.random() * 8) + 2;
      answer = a * b;
      break;
    default:
      a = 5;
      b = 5;
      answer = 10;
  }

  return { expression: `${a} ${operation} ${b}`, answer };
};

const MathChallenge = ({ onSuccess, onCancel }: MathChallengeProps) => {
  const [problem, setProblem] = useState(generateProblem);
  const [userAnswer, setUserAnswer] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTime, setLockTime] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if already unlocked
    const unlockExpiry = localStorage.getItem('parental_unlock_expiry');
    if (unlockExpiry && Date.now() < parseInt(unlockExpiry)) {
      onSuccess();
    }
  }, [onSuccess]);

  useEffect(() => {
    if (isLocked && lockTime > 0) {
      const timer = setInterval(() => {
        setLockTime((t) => {
          if (t <= 1) {
            setIsLocked(false);
            setAttempts(0);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isLocked, lockTime]);

  const handleSubmit = () => {
    const parsed = parseInt(userAnswer, 10);
    
    if (parsed === problem.answer) {
      // Success - set unlock expiry
      localStorage.setItem(
        'parental_unlock_expiry',
        String(Date.now() + UNLOCK_DURATION)
      );
      onSuccess();
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setError('תשובה שגויה, נסה שוב');
      setUserAnswer('');
      
      if (newAttempts >= MAX_ATTEMPTS) {
        setIsLocked(true);
        setLockTime(TIMEOUT_DURATION / 1000);
        setError('');
      } else {
        setProblem(generateProblem());
      }
    }
  };

  const handleNewProblem = () => {
    setProblem(generateProblem());
    setUserAnswer('');
    setError('');
  };

  if (isLocked) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Lock className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-bold mb-2">נעול זמנית</h3>
        <p className="text-muted-foreground mb-4">
          נסה שוב בעוד {lockTime} שניות
        </p>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            חזרה
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="bg-card rounded-2xl p-6 comic-shadow max-w-sm w-full">
        <div className="text-center mb-6">
          <Lock className="h-12 w-12 text-primary mx-auto mb-3" />
          <h3 className="text-xl font-bold mb-2">אזור הורים</h3>
          <p className="text-sm text-muted-foreground">
            פתור את התרגיל כדי להיכנס
          </p>
        </div>

        <div className="bg-muted rounded-xl p-4 text-center mb-4">
          <span className="text-3xl font-bold text-foreground">
            {problem.expression} = ?
          </span>
        </div>

        <div className="flex gap-2 mb-4">
          <Input
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            value={userAnswer}
            onChange={(e) => {
              setUserAnswer(e.target.value);
              setError('');
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="התשובה שלך"
            className="text-center text-xl font-bold"
            autoFocus
          />
          <Button variant="outline" size="icon" onClick={handleNewProblem}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {error && (
          <p className="text-destructive text-sm text-center mb-4">{error}</p>
        )}

        <p className="text-xs text-muted-foreground text-center mb-4">
          נסיונות: {attempts}/{MAX_ATTEMPTS}
        </p>

        <div className="flex gap-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel} className="flex-1">
              חזרה
            </Button>
          )}
          <Button onClick={handleSubmit} className="flex-1 gap-2">
            <CheckCircle className="h-4 w-4" />
            בדוק
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MathChallenge;
