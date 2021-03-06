import React, { Component } from 'react';
import {Helmet} from "react-helmet/es/Helmet";

import Content from './component/content/content-archive';
import Aux from "./hoc/Auxiliary";
import Pagination from "./component/paginations";
import NotFound from "./component/404";
import Loading from "./component/loading";

class Archive extends Component{

    constructor( props ) {
        super( props );
        this.state = {
            posts: [],
            pageName: '',
            desc: '',
            siteName: '',
            url: null,
            totalPages: null,
            currentPage: null,
            type: '',
            slug: '',
            loadedPost: false
        };
    }

    shouldComponentUpdate() {
        return this.state.url !== window.location.href;
    }

    componentDidUpdate() {
        this.fetchPosts();
    }

    componentDidMount() {
        this.fetchPosts();
    }

    fetchPosts(){
        const pageUrl = window.location.href;
        const currentType = pageUrl.split( SekelebatSettings.domain )[1].split( '/' )[0];
        let currentSlug = '';
        if( currentType === "archives" ){
            let totalPages = null;
            let archiveUrl = '';
            let currentpage = 1;
            if( pageUrl.includes('/page/') ){
                const get_archive_url = pageUrl.split('page/');
                currentpage = get_archive_url[1].split('/')[0];
                archiveUrl = get_archive_url[0];
            }else{
                archiveUrl = pageUrl;
            }
            const get_date = archiveUrl.split(SekelebatSettings.domain + 'archives/');
            currentSlug = get_date[1].slice( 0, -1 );
            const explode_date = get_date[1].split('/').filter( el => {
                return el !== '';
            } );
            let args = '';
            const monthNames = [
                "January", "February", "March",
                "April", "May", "June", "July",
                "August", "September", "October",
                "November", "December"
            ];
            let archiveName = '';
            if( explode_date.length === 1 ){
                args = '?year=' + explode_date[0];
                archiveName = 'Yearly Archives : ' + explode_date[0];
            }else if( explode_date.length === 2 ){
                args = '?year=' + explode_date[0] + '&monthnum=' + explode_date[1];
                archiveName = 'Monthly Archives : ' + monthNames[explode_date[1].replace(0,'')-1]+ ' ' + explode_date[0];
            }else{
                args = '?year=' + explode_date[0] + '&monthnum=' + explode_date[1]+ '&day=' + explode_date[2];
                archiveName = 'Daily Archives : ' + monthNames[explode_date[1].replace(0,'')-1] + ' ' + explode_date[2] + ' ' + explode_date[0];
            }

            args = args + '&date_query_column=post_modified';

            if( currentpage !== 1 ){
                args = args + '&page=' + currentpage;
            }
            const url = SekelebatSettings.domain +  "wp-json/wp/v2/posts" + args;

            fetch( url )
                .then( response => {
                    if(!response.ok){
                        throw Error(response.statusText);
                    }
                    for (var pair of response.headers.entries()) {
                        // getting the total number of pages
                        if (pair[0] === 'x-wp-totalpages') {
                            totalPages = pair[1];
                        }
                    }
                    return response.json();
                } )
                .then( result => {
                    this.setState({posts: result, pageName: archiveName, siteName: SekelebatSettings.title, totalPages: totalPages, currentPage: currentpage, type: "archives", slug: currentSlug, url: window.location.href, loadedPost: true});
                });
        }else if(currentType === "author"){
            let currentPage = 1;
            const getSlug = pageUrl.split( SekelebatSettings.domain )[1];
            const currentSlug = getSlug.split( 'author/' );
            let authorID = currentSlug[1].replace( '/', '' );
            if( currentSlug[1].includes( '/page/' ) ){
                authorID = currentSlug[1].split( '/page/' )[0];
                currentPage = currentSlug[1].split( '/page/' )[1].replace( '/', '');
            }
            const url = SekelebatSettings.domain + "wp-json/sekelebat/v1/" + getSlug;
            fetch( url )
                .then( response => {
                    if(!response.ok){
                        throw Error(response.statusText);
                    }
                    return response.json();
                } )
                .then( result => {
                    const postList = result[1];
                    this.setState({posts: postList, pageName: "Author Archive : " + result[0], siteName: result[2], totalPages: result[3]["X-WP-TotalPages"], currentPage: currentPage, type: "author", slug: authorID, url: window.location.href, loadedPost: true});
                });
        }else{
            let postList = '';
            const type = currentType === 'category' ? 'category' : 'tag';
            const typeToRequestWpRest = currentType === 'category' ? 'categories' : 'tags';
            const slugToRequest = window.location.href.split( SekelebatSettings.domain + type + '/' )[1];
            const taxonomySlug = window.location.href.split( SekelebatSettings.domain )[1].split( '/' )[1];
            const url = SekelebatSettings.domain +  "wp-json/sekelebat/v1/"+ type + "/" + slugToRequest;
            let currentPage = 1;

            if( slugToRequest.includes( '/page/' ) ){
                currentPage = slugToRequest.split('/page/')[1].replace( '/', '' );
            }

            fetch( url )
                .then( response => {
                    if ( !response.ok ) {
                        throw Error( response.statusText );
                    }
                    return response.json();
                } )
                .then( result => {
                    postList = result[1];
                    if( result[0] !== 0 ){
                        let taxUrl = SekelebatSettings.domain +  "wp-json/wp/v2/"+ typeToRequestWpRest + "/" + result[0];
                        fetch( taxUrl ).then( webResponse => {
                            if ( !webResponse.ok ) {
                                throw Error(webResponse.statusText);
                            }
                            return webResponse.json();
                        } ).then( taxResult => { /*taxResult : Taxonomy Result*/
                            this.setState({posts: postList, pageName: taxResult['name'], desc: taxResult['description'], siteName: SekelebatSettings.title, totalPages: result[2]["X-WP-TotalPages"], currentPage: currentPage, type: type, slug: taxonomySlug, url: window.location.href, loadedPost: true});
                        } )
                    }else{
                        this.setState({posts: postList, url: window.location.href, loadedPost: true});
                    }
                } );
        }
    }

    render() {
        let content = <Loading/>;
        let taxTitle = ''; // Taxonomi Title
        let pagination = '';
        let archiveTitle = '';
        let archiveDesc = '';
        if( this.state.loadedPost ){
            if( this.state.posts.length === 0 ){
                content = <NotFound />;
                taxTitle = "Page Not Found - " + SekelebatSettings.title;
            }else{
                content = this.state.posts.map( el => {
                    return (
                        <Content
                            key={el.id}
                            title={el.title['rendered']}
                            categories={el.sekelebat_post_categories}
                            tag={el.sekelebat_post_tags}
                            excerpt={el.excerpt['rendered']}
                            featuredImage={el.sekelebat_featured_image}
                            author={el.sekelebat_author_name}
                            authorID={el.author}
                            date={el.sekelebat_published_date}
                            link={el.link}
                        />
                    );
                } );
                taxTitle = this.state.pageName + ' - ' + this.state.siteName;
                pagination = <Pagination type={this.state.type} slug={this.state.slug} pagination={this.state.totalPages} currentPage={this.state.currentPage}/>;
                if( this.state.type === 'category' || this.state.type === 'tag' ){
                    archiveTitle = this.state.type + ' : ' + this.state.pageName;
                } else {
                    archiveTitle = this.state.pageName;
                }
                archiveDesc = this.state.desc;
            }
            window.scrollTo(0, 0);
        }
        return (
            <Aux>
                <Helmet>
                    <title>{taxTitle}</title>
                </Helmet>
                <div id="blog-post" className="col-12 col-md-9">
                    <div className="archive-info">
                        <h3>{archiveTitle}</h3>
                        <div className="archive-desc">{archiveDesc}</div>
                    </div>
                    <div className="row">
                        {content}
                    </div>
                    {pagination}
                </div>
            </Aux>
        );
    }

}

export default Archive;