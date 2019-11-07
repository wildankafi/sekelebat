import React, { Component } from 'react';

import ContentSingle from "./component/content/content-single";
import ContentPage from "./component/content/content-page";
import Aux from "./hoc/Auxiliary";
import PostMeta from "./component/wp-head/post-meta";
import Pagemeta from "./component/wp-head/page-meta";
import Loading from "./component/loading";
import NotFound from "./component/404";
import Comment from "./comments";
import ReactDOM from "react-dom";

class Single extends Component {

    constructor( props ) {
        super( props );
        this.state = {
            post: [],
            url: null,
            loadedPost: false,
        };
    }

    shouldComponentUpdate() {
        return this.state.url !== window.location.href;
    }

    componentDidUpdate() {
        this.fetchPost();
        this.getCommentReply();
    }

    componentDidMount() {
        this.fetchPost();
        this.getCommentReply();
    }

    getCommentReply(){
        const comment_reply = document.querySelectorAll(".comment-reply-link");
        comment_reply.forEach( function ( el ) {

            const f = document.createElement("form");
            f.setAttribute('method',"post");
            f.setAttribute('action',"submit.php");

            const i = document.createElement("input"); //input element, text
            i.setAttribute('type',"text");
            i.setAttribute('name',"username");

            const s = document.createElement("input"); //input element, Submit button
            s.setAttribute('type',"submit");
            s.setAttribute('value',"Submit");

            f.appendChild(i);
            f.appendChild(s);

            el.addEventListener( 'click', function (e) {
                console.log(e.target.attributes['data-belowelement'].nodeValue);
                document.getElementById(e.target.attributes['data-belowelement'].nodeValue).appendChild( f );
            } )
        } )
    }

    fetchPost(){
        const slug = window.location.href.split( SekelebatSettings.domain )[1];
        const url = SekelebatSettings.domain +  "wp-json/sekelebat/v1/post/" + slug;
        fetch( url )
            .then( response => {
                if ( !response.ok ) {
                    throw Error(response.statusText);
                }
                return response.json();
            } )
            .then( result => {
                this.setState({post: result, url: window.location.href, loadedPost: true});
            } );
    }

    render() {
        let content = <Loading/>;
        let meta = '';
        let metas = '';
        let comment = '';
        if( this.state.loadedPost ){
            if( this.state.post.type === 'post' ){
                let post_title = '';
                if( this.state.post.yoast_meta !== undefined ){
                    if(this.state.post.yoast_meta.length < 3){
                        post_title = {postTitle: this.state.post.title['rendered'] + ' - ' + SekelebatSettings.title};
                    }else{
                        if( this.state.post.yoast_meta[3]['og:title'] === undefined ){
                            post_title = {postTitle: this.state.post.title['rendered'] + ' - ' + SekelebatSettings.title};
                        }else{
                            post_title = {postTitle: this.state.post.title['rendered'] + ' - ' + this.state.post.yoast_meta[3]['og:title']};
                        }
                    }
                    this.state.post.yoast_meta.push(post_title);
                    metas = this.state.post.yoast_meta;
                }else{
                    post_title = {postTitle: this.state.post.title['rendered'] + ' - ' + SekelebatSettings.title};
                    metas = [post_title];
                }

                meta = <PostMeta metaData={metas} />;
                content = <ContentSingle
                    title={this.state.post.title['rendered']}
                    categories={this.state.post.sekelebat_post_categories}
                    tag={this.state.post.sekelebat_post_tags}
                    content={this.state.post.content['rendered']}
                    featuredImage={this.state.post.sekelebat_featured_image}
                    author={this.state.post.sekelebat_author_name}
                    date={this.state.post.sekelebat_published_date}
                    authorID={this.state.post.author}
                />;
                comment = <Comment comments={this.state.post.sekelebat_comment_list} title={this.state.post.title['rendered']}/>
            }else if(this.state.post.type === 'page'){
                let page_title = '';
                if( this.state.post.yoast_meta !== undefined ){
                    if(this.state.post.yoast_meta.length < 3){
                        page_title = {pageTitle: this.state.post.title['rendered'] + ' - ' + SekelebatSettings.title};
                    }else{
                        if( this.state.post.yoast_meta[3]['og:title'] === undefined ){
                            page_title = {pageTitle: this.state.post.title['rendered'] + ' - ' + SekelebatSettings.title};
                        }else{
                            page_title = {pageTitle: this.state.post.title['rendered'] + ' - ' + this.state.post.yoast_meta[3]['og:title']};
                        }
                    }
                    this.state.post.yoast_meta.push(page_title);
                    metas = this.state.post.yoast_meta;
                }else{
                    page_title = {pageTitle: this.state.post.title['rendered'] + ' - ' + SekelebatSettings.title};
                    metas = [page_title];
                }

                meta = <Pagemeta metaData={metas} />;
                content = <ContentPage
                    title={this.state.post.title['rendered']}
                    content={this.state.post.content['rendered']}
                    featuredImage={this.state.post.sekelebat_featured_image}
                    author={this.state.post.sekelebat_author_name}
                    authorSlug={this.state.post.sekelebat_get_author_slug}
                    date={this.state.post.sekelebat_published_date}
                />;
                comment = <Comment comments={this.state.post.sekelebat_comment_list} title={this.state.post.title['rendered']}/>
            }else if( this.state.post.data['status'] === 404 ){
                content = <NotFound/>;
                meta = <PostMeta metaData="404" />;
            }
            window.scrollTo(0, 0);
        }

        return (
            <Aux>
                {meta}
                <article id="single-post" className="col-12 col-md-9">
                    {content}
                    {comment}
                </article>
            </Aux>
        );
    }

}

export default Single;