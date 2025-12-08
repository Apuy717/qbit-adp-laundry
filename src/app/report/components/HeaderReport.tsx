type HeaderType = {
  title: string;
  description: string;
}

export function HeaderReport(props: HeaderType) {
  return (<>
  <section className="mt-3 lg:mt-0">
        <h1 className="text-2xl font-semibold capitalize text-slate-700 dark:text-slate-100">
          {/* report merchant - all */}
          {props.title}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-300">
          {/* Welcome to bossq merchant */}
          {props.description}
        </p>
      </section>
  </>)
}