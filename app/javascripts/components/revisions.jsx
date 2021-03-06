import moment from "moment";

/**
 * The revisions panel represents the list of revisions for the particular run
 * @param props
 * @returns {XML}
 * @constructor
 */
const RevisionsPanel = ( props ) => {
    return (
        <div className={`side-panel ${props.showingRevisions?'open':''}`}>
            <h3>Revisions <i className="fa fa-close" onClick={props.hideRevisions}></i></h3>
            <ul>
                {props.revisions.map(r=><li key={r.hash} className={`${props.revision == r.hash?'active':''}`}>
                    <a href={`/${props.bin}/${r.hash}`}> <i className="fa fa-link"></i>
                        <span className="revision-hash">{r.hash}</span> {moment(r.createdAt).fromNow()} </a>
                </li>)}
            </ul>
        </div>
    )
};
//Export a named function for debugging
export default RevisionsPanel;