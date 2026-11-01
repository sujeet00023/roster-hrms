// A template (unlike a layout) re-mounts on every navigation, which replays the fade-in
// so moving between pages feels like one smooth motion instead of a hard swap.
export default function dashboardTemplate({children}: {children: React.ReactNode}) {
    return <div className="animate-fade-up">{children}</div>;
}