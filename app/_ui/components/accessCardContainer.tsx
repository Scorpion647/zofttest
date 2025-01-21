export default function AccessCardContainer(props: { children: React.ReactNode }) {
    return (
        <div className="card bg-base-100 shadow-md shadow-neutral/20 rounded-xl items-center py-8 w-svw h-svh md:w-2/5 md:min-w-fit md:max-w-[400px] md:h-4/5 md:max-h-[600px]">
            <div className="card-body gap-4">
                {props.children}
            </div>
        </div>
    )
}