import ListPanel from "./panels/list_panel";

/**
 * CssPanel represents the list of CSS resources
 */
class CssPanel extends ListPanel {

    getPlaceHolder() {
        return "e.g. https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css";
    }

    getDescription() {
        return "Add external CSS resources that will be added to the head of your application";
    }

    getTitle() {
        return "CSS Resources"
    }

}

export default CssPanel;