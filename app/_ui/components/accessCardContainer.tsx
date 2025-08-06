export default function AccessCardContainer(props: {
  children: React.ReactNode;
}) {
  return (
    <div className="card h-svh w-svw items-center rounded-xl bg-base-100 py-8 shadow-md shadow-neutral/20 md:h-4/5 md:max-h-[600px] md:w-2/5 md:min-w-fit md:max-w-[400px]">
      <div className="card-body gap-4">{props.children}</div>
    </div>
  );
}
