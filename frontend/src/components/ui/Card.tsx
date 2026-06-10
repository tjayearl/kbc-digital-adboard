import clsx from 'clsx';

type CardProps = {
  children: React.ReactNode;
  className?: string;
  id?: string;
};

export function Card({ children, className, id }: CardProps) {
  return <section id={id} className={clsx('rounded-lg border border-slate-200 bg-white shadow-soft', className)}>{children}</section>;
}

export function CardHeader({ children, className }: CardProps) {
  return <div className={clsx('border-b border-slate-100 px-5 py-4', className)}>{children}</div>;
}

export function CardBody({ children, className }: CardProps) {
  return <div className={clsx('p-5', className)}>{children}</div>;
}
